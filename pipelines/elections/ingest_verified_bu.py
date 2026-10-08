"""Reproducible section-level extraction; no neighborhood or final-result inference."""
from pathlib import Path
import argparse, csv, hashlib, io, json, zipfile, gzip


def extract(rows, municipality, year, turn):
    sections, catalog, seen = {}, {}, set()
    for row in rows:
        if (row['CD_MUNICIPIO'], row['ANO_ELEICAO'], row['NR_TURNO'], row['CD_CARGO_PERGUNTA']) != (municipality, year, turn, '1'):
            continue
        key = f"{row['NR_ZONA']}-{row['NR_SECAO']}"
        counts = {k:int(row[v]) for k,v in [('eligible','QT_APTOS'),('turnout','QT_COMPARECIMENTO'),('abstention','QT_ABSTENCOES')]}
        section = sections.setdefault(key, {'sourceUnitId':key, 'label':f"Zona {row['NR_ZONA']} · seção {row['NR_SECAO']}", 'pollingPlaceId':row['NR_LOCAL_VOTACAO'], **counts, 'validVotes':0,'blankVotes':0,'nullVotes':0,'candidateVotes':{}})
        if any(section[k] != v for k,v in counts.items()):
            raise ValueError(f'Conflicting section totals: {key}')
        if section['pollingPlaceId'] != row['NR_LOCAL_VOTACAO']:
            raise ValueError(f'Conflicting polling place: {key}')
        vote_key = (key,row['CD_TIPO_VOTAVEL'],row['NR_VOTAVEL'])
        if vote_key in seen: raise ValueError(f'Duplicate BU row: {vote_key}')
        seen.add(vote_key)
        votes = int(row['QT_VOTOS'])
        if votes < 0: raise ValueError('Negative votes')
        kind = row['CD_TIPO_VOTAVEL']
        if kind == '1':
            number = row['NR_VOTAVEL']
            if number in section['candidateVotes']: raise ValueError(f'Duplicate candidate: {key}/{number}')
            section['candidateVotes'][number] = votes
            section['validVotes'] += votes
            candidate = {'id':f'ballot-{number}','officialName':row['NM_VOTAVEL'],'ballotNumber':number,'partyId':row['SG_PARTIDO'],'display':{}}
            if number in catalog and catalog[number] != candidate: raise ValueError('Conflicting candidate catalog')
            catalog[number] = candidate
        elif kind in ('2','3'):
            field = 'blankVotes' if kind == '2' else 'nullVotes'
            if section[field] != 0: raise ValueError(f'Duplicate vote category: {key}')
            section[field] = votes
        else: raise ValueError(f'Unsupported vote type: {kind}')
    if not sections: raise ValueError('No presidential sections found')
    for section in sections.values():
        if section['eligible'] != section['turnout'] + section['abstention']: raise ValueError('Electorate reconciliation failed')
        if section['turnout'] != section['validVotes'] + section['blankVotes'] + section['nullVotes']: raise ValueError('Vote reconciliation failed')
    fields = ('eligible','turnout','abstention','validVotes','blankVotes','nullVotes')
    summary = {field:sum(section[field] for section in sections.values()) for field in fields}
    summary['sections'] = len(sections)
    summary['candidateVotes'] = {number:sum(section['candidateVotes'].get(number,0) for section in sections.values()) for number in sorted(catalog)}
    return {'schemaVersion':'election-results-v1','sourceGrain':'polling-section','analysisUnit':'polling-section','roundId':turn,'municipalityCodeTSE':municipality,'validVotesMeaning':'nominal-bu','rows':[sections[key] for key in sorted(sections)],'summary':summary,'semantics':'Extração de boletins de urna: votos nominais registrados, sem inferir resultado final homologado ou resultados por bairro.'}, list(catalog.values())


def write_immutable(path, value):
    data = (json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n').encode()
    if path.exists() and path.read_bytes() != data: raise ValueError(f'Immutable revision collision: {path}')
    path.write_bytes(data)
    return hashlib.sha256(data).hexdigest()


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--archive',type=Path,required=True)
    parser.add_argument('--snapshot',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--capture',type=Path)
    parser.add_argument('--municipality',default='81752')
    parser.add_argument('--year',default='2026')
    parser.add_argument('--round',default='1')
    args=parser.parse_args()
    snapshot=json.loads(args.snapshot.read_text())
    raw=args.archive.read_bytes()
    for algorithm in ('sha256','sha512'):
        if hashlib.new(algorithm,raw).hexdigest() != snapshot[algorithm]: raise ValueError(f'{algorithm} mismatch')
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        members=[name for name in archive.namelist() if name.endswith('.csv')]
        if len(members)!=1: raise ValueError('Expected exactly one CSV')
        with archive.open(members[0]) as stream:
            reader=csv.DictReader(io.TextIOWrapper(stream,encoding='latin1'),delimiter=';')
            selected=[]
            def capture():
                for row in reader:
                    if (row['CD_MUNICIPIO'],row['ANO_ELEICAO'],row['NR_TURNO'],row['CD_CARGO_PERGUNTA']) == (args.municipality,args.year,args.round,'1'):
                        selected.append(row)
                    yield row
            payload,catalog=extract(capture(),args.municipality,args.year,args.round)
            if args.capture:
                output=io.StringIO(newline='');writer=csv.DictWriter(output,fieldnames=reader.fieldnames,delimiter=';',quoting=csv.QUOTE_ALL,lineterminator='\n');writer.writeheader();writer.writerows(selected)
                captured=output.getvalue().encode('utf-8')
                stored=gzip.compress(captured,mtime=0) if args.capture.suffix=='.gz' else captured
                args.capture.parent.mkdir(parents=True,exist_ok=True)
                if args.capture.exists() and args.capture.read_bytes()!=stored:raise ValueError('Source capture collision')
                args.capture.write_bytes(stored)
                manifest={'rawArchiveSha256':snapshot['sha256'],'rawArchiveSha512':snapshot['sha512'],'subsetSha256':hashlib.sha256(captured).hexdigest(),'rows':len(selected),'normalization':'CSV values preserved; UTF-8, quoted fields and LF; original archive available via source snapshot','sourceSnapshot':str(args.snapshot),'filter':{'municipality':args.municipality,'year':args.year,'turn':args.round,'cargo':'1'}}
                base=args.capture.with_suffix('') if args.capture.suffix=='.gz' else args.capture
                if args.capture.suffix=='.gz':manifest.update(compressedSha256=hashlib.sha256(stored).hexdigest(),compressedFile=args.capture.name)
                write_immutable(base.with_suffix('.provenance.json'),manifest)
    args.output.mkdir(parents=True,exist_ok=True)
    encoded=(json.dumps(payload,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n').encode()
    checksum=hashlib.sha256(encoded).hexdigest()
    revision='bu-'+checksum[:12]
    name=f'presidential-{args.year}-r{args.round}-{revision}'
    write_immutable(args.output/(name+'.json'),payload)
    write_immutable(args.output/(name+'.candidates.json'),catalog)
    descriptor={'id':f'elections-presidential-{args.year}-r{args.round}-bu','revision':revision,'supersedes':None,'moduleId':'elections','domainId':'presidential','periodId':args.year,'roundId':args.round,'status':'provisional','sourceStatus':'totalized','derivedStatus':'provisional','asOf':snapshot['retrievedAt'],'publishedAt':snapshot['retrievedAt'],'sourceGrain':'polling-section','analysisUnit':'polling-section','territoryId':'br-sc-jaragua-do-sul','territoryVintage':'tse-section-'+args.year,'crosswalkId':None,'format':'json','uri':'./'+name+'.json','schemaRef':'election-results-v1','candidateCatalogUri':'./'+name+'.candidates.json','comparisonPolicyId':'municipality-aggregate-v1','provenance':{'sourceId':snapshot['sourceId'],'sourceUrl':snapshot['dataUrl'],'collectedAt':snapshot['retrievedAt'],'license':None,'methodDoc':'https://github.com/alldevitone-maker/Atlas-Project/blob/main/docs/bu-source-reconciliation.md'},'quality':{'coveragePct':100,'reconciled':True,'notes':['SHA-256 e SHA-512 do arquivo bruto verificados. Todas as seções extraídas reconciliam internamente; completude contra universo externo não certificada.','BU nominal não equivale a resultado final homologado. Sem correspondência espacial auditada.','Divergência com legado: +10 votos nominais e -10 nulos; comparação bloqueada até esclarecer semântica.']},'checksum':checksum}
    write_immutable(args.output/(name+'.dataset.json'),descriptor)
    print(json.dumps({'file':name,'revision':revision,'summary':payload['summary'],'rawSha256':snapshot['sha256']},ensure_ascii=False))

if __name__=='__main__': main()

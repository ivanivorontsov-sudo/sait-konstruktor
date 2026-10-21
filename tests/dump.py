import json,sys,os,base64
files=json.load(open(sys.argv[1]));out=sys.argv[2];os.makedirs(out,exist_ok=True)
for p,f in files.items():
    fp=os.path.join(out,p);os.makedirs(os.path.dirname(fp),exist_ok=True)
    open(fp,'wb').write(base64.b64decode(f['b64']) if 'b64' in f else f['text'].encode())
print(len(files),'files ->',out)

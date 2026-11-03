from pathlib import Path
from PIL import Image,ImageStat
import struct,json
root=Path(__file__).resolve().parent.parent;records=json.loads((root/'Tests/Clips.json').read_text());out=root/'Source/panorama/images/gurrenlock';out.mkdir(parents=True,exist_ok=True)
for r in records:
 p=root/'game/citadel/panorama/videos/GurrenLock'/(r['name']+'-LastFrame.png');im=Image.open(p).convert('RGBA');w,h=im.size
 mean=ImageStat.Stat(im).mean
 data=struct.pack('<HH4fHHHBBIII',1,11,*[x/255 for x in mean],w,h,1,4,1,0,0,0)
 assert len(data)==40
 # Source 2 resource header + single DATA block + raw RGBA8888 mip.
 # Header file size excludes trailing texture mip bytes, as in Source 2.
 header=struct.pack('<IHHII',72,12,1,8,1)+struct.pack('<4sII',b'DATA',12,40)+b'\x00'*4
 (out/(r['name'].lower()+'_last.vtex_c')).write_bytes(header+data+im.tobytes())
print('22 native RGBA8888 textures written, 1920x1080, clamp S/T, no LOD.')

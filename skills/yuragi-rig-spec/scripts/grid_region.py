#!/usr/bin/env python3
"""Render a source-coordinate crop grid without trimming the annotation coordinate system."""
import argparse
from PIL import Image, ImageDraw
from pathlib import Path

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source');parser.add_argument('--region',required=True,help='x0,y0,x1,y1 in source pixels')
    parser.add_argument('--step',type=int,default=10);parser.add_argument('--out',required=True)
    args=parser.parse_args();box=tuple(map(int,args.region.split(',')))
    with Image.open(args.source) as image:
        if len(box)!=4 or not(0<=box[0]<box[2]<=image.width and 0<=box[1]<box[3]<=image.height) or args.step<1: parser.error('Invalid crop or step')
        crop=image.convert('RGBA').crop(box);draw=ImageDraw.Draw(crop)
        for x in range(box[0],box[2],args.step): draw.line((x-box[0],0,x-box[0],crop.height),fill=(0,140,210,160));draw.text((x-box[0]+2,2),str(x),fill=(0,50,90,255))
        for y in range(box[1],box[3],args.step): draw.line((0,y-box[1],crop.width,y-box[1]),fill=(0,140,210,160));draw.text((2,y-box[1]+2),str(y),fill=(0,50,90,255))
        output=Path(args.out)
        if output.exists(): parser.error('Output exists; choose a new file')
        output.parent.mkdir(parents=True,exist_ok=True);crop.save(output)
if __name__=='__main__': main()

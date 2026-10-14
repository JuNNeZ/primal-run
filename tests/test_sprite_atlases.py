"""Packing invariants on small independent fixtures; no production output writes."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from PIL import Image

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from build_sprite_atlases import build_atlases, group_for
from species_sheet_plan import make_plan

CONFIG=dict(version=1,padding=1,max_dimension=256,world_bundles={'ui':'world_shared'})

class AtlasTests(unittest.TestCase):
    def test_aliases_keep_individual_anchors_and_ids(self):
        with tempfile.TemporaryDirectory() as folder:
            game=Path(folder);(game/'assets/ui').mkdir(parents=True)
            entries=[]
            for name,size,color,anchor in [('a',(32,48),(12,24,36,255),[2,3]),
                    ('b',(32,48),(12,24,36,255),[6,7]),
                    ('c',(64,16),(12,24,36,255),[0,0]),
                    ('d',(32,48),(12,24,37,255),[2,3])]:
                file=f'assets/ui/{name}.png';Image.new('RGBA',size,color).save(game/file)
                entries.append(dict(file=file,size=list(size),origin=anchor))
            first=build_atlases(entries,game,CONFIG)
            self.assertEqual(first['alias_frames'],1)
            self.assertEqual(first['unique_frames'],3)
            a,b=[first['frames'][f'assets/ui/{n}.png'] for n in ('a','b')]
            self.assertEqual(b['alias_of'],'assets/ui/a.png')
            self.assertEqual([a[k] for k in ('file','x','y','w','h')],[b[k] for k in ('file','x','y','w','h')])
            self.assertNotEqual(a['anchor'],b['anchor'])
            for entry in entries:
                frame=first['frames'][entry['file']];x,y,w,h=[frame[k] for k in ('x','y','w','h')]
                with Image.open(game/frame['file']) as sheet:
                    self.assertEqual(sheet.crop((x,y,x+w,y+h)).tobytes(),Image.open(game/entry['file']).tobytes())
                    self.assertFalse(any(sheet.crop((x-1,y-1,x+w+1,y)).tobytes()))
            self.assertEqual(first,build_atlases(list(reversed(entries)),game,CONFIG))
            sentinel=game/'assets/atlases/keep.txt';sentinel.write_text('preserved')
            with self.assertRaises(ValueError):
                build_atlases([dict(file='assets/ui/a.png',size=[256,48],origin=[0,0])],game,CONFIG)
            self.assertTrue(sentinel.exists(),'reject bad inputs before deleting existing atlases')

    def test_future_species_and_explicit_bundle(self):
        self.assertEqual(group_for(dict(file='assets/new_family/test.png',species='new_species'),CONFIG),'species_new_species')
        self.assertEqual(group_for(dict(file='assets/ui/test.png',atlas_group='custom_bundle'),CONFIG),'custom_bundle')
        with self.assertRaises(ValueError):
            group_for(dict(file='assets/ui/test.png',atlas_group='../escape'),CONFIG)

    def test_species_authoring_recipe(self):
        plan=make_plan('new_species',anchors={'N':[72,64]})
        self.assertEqual(plan['runtime_group'],'species_new_species')
        self.assertFalse(plan['production_approved'])
        self.assertEqual(sum(len(s['frames']) for s in plan['sheets']),120)
        paths=set()
        for sheet in plan['sheets']:
            self.assertEqual(sheet['size'],[864,720])
            crops=set()
            for frame in sheet['frames']:
                x,y,w,h=frame['crop'];self.assertLessEqual(x+w,864);self.assertLessEqual(y+h,720)
                self.assertNotIn(tuple(frame['crop']),crops);crops.add(tuple(frame['crop']))
                paths.add(frame['file'])
                self.assertEqual(frame['origin'],[72,64] if sheet['direction']=='N' else [72,72])
        self.assertEqual(len(paths),120)
        with self.assertRaises(ValueError): make_plan('New Species')
        with self.assertRaises(ValueError): make_plan('test',origin=[144,72])

if __name__=='__main__': unittest.main()

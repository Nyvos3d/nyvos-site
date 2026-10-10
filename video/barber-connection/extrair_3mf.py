"""Extrai as malhas do 3MF do cliente para buffers binários lidos pela cena (sem remodelar nada).

    python3 -I extrair_3mf.py <arquivo.3mf> cena/modelo

Para cada objeto com malha: <nome>.pos.bin (float32 xyz, mm) e <nome>.idx.bin (uint32),
mais meta.json com material, cor, limites e verificação de arestas (malha fechada = 0).
"""
import json
import os
import sys
import zipfile
import xml.etree.ElementTree as ET

import numpy as np

NS = {'m': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}


def main(arquivo, saida):
    os.makedirs(saida, exist_ok=True)
    with zipfile.ZipFile(arquivo) as z:
        root = ET.fromstring(z.read('3D/3dmodel.model'))
    mats = [(b.get('name'), b.get('displaycolor')) for b in root.find('.//m:basematerials', NS)]
    meta = []
    for obj in root.findall('.//m:object', NS):
        mesh = obj.find('m:mesh', NS)
        if mesh is None:
            continue
        V = np.array([[float(v.get(k)) for k in 'xyz'] for v in mesh.find('m:vertices', NS)], dtype=np.float32)
        T = np.array([[int(t.get(k)) for k in ('v1', 'v2', 'v3')] for t in mesh.find('m:triangles', NS)], dtype=np.uint32)
        nome = obj.get('name')
        V.tofile(os.path.join(saida, f'{nome}.pos.bin'))
        T.tofile(os.path.join(saida, f'{nome}.idx.bin'))
        arestas = np.sort(np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]]), axis=1)
        _, cont = np.unique(arestas, axis=0, return_counts=True)
        mat = mats[int(obj.get('pindex'))]
        meta.append(dict(nome=nome, material=mat[0], cor=mat[1], vertices=len(V), triangulos=len(T),
                         min=V.min(0).round(3).tolist(), max=V.max(0).round(3).tolist(),
                         arestas_nao_manifold=int((cont != 2).sum())))
    with open(os.path.join(saida, 'meta.json'), 'w') as f:
        json.dump(meta, f, indent=1, ensure_ascii=False)
    for m in meta:
        print(m)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])

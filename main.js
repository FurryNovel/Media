import {globSync} from "glob";
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import Sharp from 'sharp';

fs.existsSync('dist') && fs.rmSync('dist', {recursive: true});

fs.mkdirSync('dist', {recursive: true});

const assets = Object.fromEntries(
    globSync('assets/**/*.*').map(file => [
        path.relative('assets', file),
        fileURLToPath(new URL(file, import.meta.url))
    ])
);
for (const name of Object.keys(assets)) {
    let sharp = new Sharp(assets[name])
    fs.mkdirSync(`dist/${path.dirname(name)}`, {recursive: true});
    
    await processImage(sharp, name.replace(path.extname(name), ''))
}


async function processImage(sharp, name) {
    const tasks = [];
    const meta = await sharp.metadata();
    
    const formats = {
        'webp': {
            effort: 6,
            smartSubsample: true,
        },
        'png': {
            colors: 256,
            effort: 10,
            compressionLevel: 9,
        },
    };
    
    for (const format of Object.keys(formats)) {
        //full
        tasks.push(
            sharp.clone()[format]({
                ...formats[format],
            }).toFile(`dist/${name}.full.${format}`)
        );
        
        // //暂时不需要 50%
        // tasks.push(
        //     sharp.clone().resize(
        //         Math.round(meta.width / 2),
        //         Math.round(meta.height / 2)
        //     )[format]({
        //         ...formats[format],
        //     }).toFile(`dist/${name}.50p.${format}`)
        // );
    }
    
    await Promise.all(tasks);
}

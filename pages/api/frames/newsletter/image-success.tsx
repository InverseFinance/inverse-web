import { getFramePngBuffer } from '@app/util/frames-server';

export default async function handler(req, res) {
    try {
        const pngBuffer = await getFramePngBuffer({
            title: 'Your entry has been received!',            
        });
        // Set the content type to PNG and send the response
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'max-age=60');
        res.send(pngBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating image');
    }
}

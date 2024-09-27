import { FRAME_BASE_URL } from '@app/util/frames';
import { getCorrectImage, getFramePngBuffer, getIncorrectImage } from '@app/util/frames-server';

const QUESTIONS = {
    '1': "Question 1: sDOLA is a...",
    '2': "Question 2: sDOLA derives its yield from...",
    '3': "Question 3: TBD...",
};

const ANSWERS = {
    '1': "sDOLA is a yield-bearing stablecoin!",
    '2': "sDOLA derives its revenue from FiRM!",
    '3': "TBD!",
};

export default async function handler(req, res) {
    try {
        const { answer, q } = req.query;
        const props = { subtitle: ANSWERS[q] };
        let pngBuffer;

        if(!answer) {
            pngBuffer = await getFramePngBuffer({
                title: QUESTIONS[q],            
                imageSrc: FRAME_BASE_URL+'/assets/sDOLAx512.png',              
            });            
        } else {
            pngBuffer = answer === 'correct' ? await getCorrectImage(props) : await getIncorrectImage(props);
        }
        // Set the content type to PNG and send the response
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'max-age=31536000');
        res.send(pngBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating image');
    }
}

import Lottie from 'react-lottie';

type AnimProps = {
    animData: Object,
    height?: number,
    width?: number,
    loop?: boolean,
}

export const Animation = ({ animData, height = 30, width = 30, loop = false }: AnimProps) => {
    return (
        <Lottie
            options={{
                loop: loop,
                animationData: animData,
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid slice'
                },
            }}
            height={height}
            width={width}
        />
    )
}
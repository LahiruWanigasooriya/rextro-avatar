import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

export function Background() {
    const texture = useTexture('logo_v1.png');
    const { viewport } = useThree();

    const scale = useMemo(() => {
        // Calculate viewport dimensions at z = -5
        // Camera is at z = 2.5 (from App.tsx), Background is at z = -5 (so depth from camera is 7.5)
        // getCurrentViewport takes target distance as vector or number? 
        // It takes (camera, target, size). If target is a vector3, it calculates distance.
        // Let's pass the position we want the viewport for.
        const { width, height } = viewport.getCurrentViewport(undefined, [0, 0, -5]);

        // Calculate aspect ratios
        const screenAspect = width / height;
        // Default to 1 if image not loaded yet
        const imageAspect = texture.image ? (texture.image.width / texture.image.height) : 1;

        let scaleX, scaleY;

        if (screenAspect > imageAspect) {
            // Screen is wider than image -> fit to width
            scaleX = width;
            scaleY = width / imageAspect;
        } else {
            // Screen is taller than image -> fit to height
            scaleY = height;
            scaleX = height * imageAspect;
        }

        return [scaleX, scaleY, 1] as [number, number, number];
    }, [viewport, texture]);

    return (
        <mesh position={[0, 0, -5]} scale={scale}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
                map={texture}
                transparent
                toneMapped={false}
            />
        </mesh>
    );
}

export default Background;

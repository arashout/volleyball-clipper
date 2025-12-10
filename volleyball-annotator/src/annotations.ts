import { ActionAnnotation } from './types';

export const ACTION_LABELS = [
    "ball",
    "block",
    "receive",
    "set",
    "spike",
    "serve",
]

export function annotationsToYOLO(
    annotations: ActionAnnotation[],
    videoWidth: number,
    videoHeight: number
): string {
    return annotations.map(annotation => {
        const classId = ACTION_LABELS.indexOf(annotation.label);
        if (classId === -1) return null;

        const xCenter = (annotation.bbox.x + annotation.bbox.width / 2) / videoWidth;
        const yCenter = (annotation.bbox.y + annotation.bbox.height / 2) / videoHeight;
        const width = annotation.bbox.width / videoWidth;
        const height = annotation.bbox.height / videoHeight;

        return `${classId} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
    }).filter(Boolean).join('\n');
}

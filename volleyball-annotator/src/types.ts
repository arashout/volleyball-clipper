export interface Clip {
  startTime: number;
  endTime: number | null;
}

export interface ActionAnnotation {
  time: number;
  label: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

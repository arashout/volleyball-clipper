  YOLO Training File Format Example

  Directory Structure:

  dataset/
  ├── images/
  │   ├── train/
  │   │   ├── frame_0001.jpg
  │   │   ├── frame_0002.jpg
  │   │   └── ...
  │   └── val/
  │       ├── frame_1001.jpg
  │       └── ...
  ├── labels/
  │   ├── train/
  │   │   ├── frame_0001.txt
  │   │   ├── frame_0002.txt
  │   │   └── ...
  │   └── val/
  │       ├── frame_1001.txt
  │       └── ...
  └── data.yaml

  Example Annotation File (frame_0001.txt):

  4 0.523 0.312 0.156 0.234
  1 0.678 0.445 0.112 0.189
  3 0.234 0.567 0.098 0.145

  Format: <class_id> <x_center> <y_center> <width> <height>
  - All values normalized (0-1)
  - x_center, y_center: bounding box center
  - width, height: box dimensions
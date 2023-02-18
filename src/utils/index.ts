export enum ControlType {
  Normal,
  Move,
  TransformTopLeft,
  TransformTopCenter,
  TransformTopRight,
  TransformCenterLeft,
  TransformCenterRight,
  TransformBottomLeft,
  TransformBottomCenter,
  TransformBottomRight,
}
export type ClipRectInfo = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageInfo = { width: number; height: number; img?: HTMLImageElement };

/**
 * @description 设置鼠标样式
 */
export function setMouseCursor(canvas: HTMLCanvasElement, type: ControlType) {
  switch (type) {
    case ControlType.Move: {
      canvas.style.cursor = "move";
      break;
    }
    case ControlType.TransformTopLeft: {
      canvas.style.cursor = "se-resize";
      break;
    }
    case ControlType.TransformTopCenter: {
      canvas.style.cursor = "ns-resize";
      break;
    }
    case ControlType.TransformTopRight: {
      canvas.style.cursor = "sw-resize";
      break;
    }
    case ControlType.TransformCenterLeft: {
      canvas.style.cursor = "w-resize";
      break;
    }
    case ControlType.TransformCenterRight: {
      canvas.style.cursor = "w-resize";
      break;
    }
    case ControlType.TransformBottomLeft: {
      canvas.style.cursor = "sw-resize";
      break;
    }
    case ControlType.TransformBottomCenter: {
      canvas.style.cursor = "ns-resize";
      break;
    }
    case ControlType.TransformBottomRight: {
      canvas.style.cursor = "se-resize";
      break;
    }
    default:
      canvas.style.cursor = "auto";
      break;
  }
}

/**
 * @description 根据上一次的裁剪几何信息及其位移返回最新的几何信息
 */
export function getClipRectTransformInfo(clipRect: ClipRectInfo, moveX: number, moveY: number, type: ControlType) {
  let { x, y, width, height } = clipRect;
  // 根据控制类型操作裁剪框
  switch (type) {
    case ControlType.Move: {
      x = x + moveX;
      y = y + moveY;
      break;
    }
    case ControlType.TransformTopLeft: {
      x = x + moveX;
      y = y + moveY;
      width = width - moveX;
      height = height - moveY;
      break;
    }
    case ControlType.TransformTopCenter: {
      y = y + moveY;
      height = height - moveY;
      break;
    }
    case ControlType.TransformTopRight: {
      y = y + moveY;
      width = width + moveX;
      height = height - moveY;
      break;
    }
    case ControlType.TransformCenterLeft: {
      x = x + moveX;
      width = width - moveX;
      break;
    }
    case ControlType.TransformCenterRight: {
      width = width + moveX;
      break;
    }
    case ControlType.TransformBottomLeft: {
      x = x + moveX;
      width = width - moveX;
      height = height + moveY;
      break;
    }
    case ControlType.TransformBottomCenter: {
      height = height + moveY;
      break;
    }
    case ControlType.TransformBottomRight: {
      width = width + moveX;
      height = height + moveY;
    }
  }
  return {
    x,
    y,
    width,
    height,
  };
}

export function loadImage(file: File) {
  const reader = new FileReader();
  return new Promise<ImageInfo>((resolve) => {
    reader.readAsDataURL(file);
    reader.onload = function () {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = function () {
        resolve({
          width: img.width,
          height: img.height,
          img,
        });
      };
    };
  });
}

export function limitingClipRect(data: ClipRectInfo, maxX: number, maxY: number, maxWidth: number, maxHeight: number) {
  const { x, y, height, width } = data;
  return {
    x: Math.max(Math.min(x, maxX), 0),
    y: Math.max(Math.min(y, maxY), 0),
    width: Math.max(Math.min(width, maxWidth), 100),
    height: Math.max(Math.min(height, maxHeight), 100),
  };
}

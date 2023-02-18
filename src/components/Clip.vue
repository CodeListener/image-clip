<template>
  <div class="wrapper" :style="wrapperStyle">
    <canvas :ref="(v) => (canvas = v as HTMLCanvasElement)" @mousedown="mouseDownHandler" @mousemove="mouseMoveHandler"></canvas>
    <div class="btns"></div>
  </div>
  <button @click="generate">确认</button>
</template>
<script lang="ts">
const DEFUALT_WIDTH = 300;
const DEFUALT_HEIGHT = 300;
const CLIP_RECT_DEFAULT = {
  x: DEFUALT_WIDTH / 2 - 50,
  y: DEFUALT_HEIGHT / 2 - 50,
  width: 100,
  height: 100,
};
</script>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ControlType, setMouseCursor, ClipRectInfo, limitingClipRect, getClipRectTransformInfo, ImageInfo, loadImage } from "../utils/index";

type Position = { x: number; y: number };

let clipRectTempInfo = {} as ClipRectInfo;
const props = withDefaults(defineProps<{ file?: File; width?: number; height?: number }>(), {
  width: DEFUALT_WIDTH,
  height: DEFUALT_HEIGHT,
});

const canvas = ref<HTMLCanvasElement>();
const width = ref(300);
const height = ref(300);
const imgInfo = ref<ImageInfo>({ width: width.value, height: height.value });
const clipRect = ref<ClipRectInfo>(CLIP_RECT_DEFAULT);
const startPosition = ref<Position>({ x: 0, y: 0 });
const delta = ref<Position>({ x: 0, y: 0 });
const curMousePosition = ref<Position>({ x: 0, y: 0 });
const isTouching = ref<Boolean>(false);
const controlType = ref<ControlType>(ControlType.Normal);
const context = ref<CanvasRenderingContext2D>();
const wrapperStyle = computed(() => ({
  width: `${width}px`,
  height: `${height}px`,
}));

onMounted(() => {
  context.value = canvas.value?.getContext("2d")!;
});

const getPosition = (e: MouseEvent) => {
  const x = e.clientX - canvas.value!.offsetLeft;
  const y = e.clientY - canvas.value!.offsetTop;
  return { x, y };
};
const mouseDownHandler = (e: MouseEvent) => {
  isTouching.value = true;
  startPosition.value = getPosition(e);
  document.addEventListener("mousemove", mouseMoveHandler);
  document.addEventListener("mouseup", mouseUpHandler);
};
const mouseMoveHandler = (e: MouseEvent) => {
  if (!props.file) return;
  const pos = getPosition(e);
  curMousePosition.value = getPosition(e);
  if (isTouching.value) {
    delta.value.x = pos.x - (startPosition.value.x ?? 0);
    delta.value.y = pos.y - (startPosition.value.y ?? 0);
  }
  renderCanvas();
};
const mouseUpHandler = () => {
  document.removeEventListener("mousemove", mouseMoveHandler);
  document.removeEventListener("mouseup", mouseUpHandler);
  clipRect.value = clipRectTempInfo;
  isTouching.value = false;
  delta.value.x = 0;
  delta.value.y = 0;
};

const drawPicture = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) => {
  ctx.globalCompositeOperation = "destination-over";
  ctx.drawImage(img, 0, 0, width, height);
};
const drawMask = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, width, height);
};

const drawClipRect = (ctx: CanvasRenderingContext2D, mouseX: number = 0, mouseY: number = 0) => {
  const mouseCurPos = { x: mouseX, y: mouseY };

  clipRectTempInfo = isTouching ? getClipRectTransformInfo(clipRect.value, delta.value.x, delta.value.y, controlType.value) : clipRect.value;
  const { width: canvasWidth, height: canvasHeight } = canvas.value!;
  clipRectTempInfo = limitingClipRect(clipRectTempInfo, canvasWidth - clipRectTempInfo.width, canvasHeight - clipRectTempInfo.height, canvasWidth, canvasHeight);
  const { x, y, width, height } = clipRectTempInfo;
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.clearRect(x, y, width, height);
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,255,255,1)";
  ctx.lineWidth = 2;
  ctx.rect(x, y, width, height);
  ctx.stroke();
  ctx.closePath();
  let isIn = false;
  if (!isTouching.value) {
    isIn = moveInTarget(mouseCurPos, ControlType.Move);
  }
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
  // 控制点
  const points = [
    [x, y, ControlType.TransformTopLeft],
    [x + width / 2, y, ControlType.TransformTopCenter],
    [x + width, y, ControlType.TransformTopRight],
    [x, y + height / 2, ControlType.TransformCenterLeft],
    [x + width, y + height / 2, ControlType.TransformCenterRight],
    [x, y + height, ControlType.TransformBottomLeft],
    [x + width / 2, y + height, ControlType.TransformBottomCenter],
    [x + width, y + height, ControlType.TransformBottomRight],
  ];
  points.forEach((point) => {
    const [x, y, type] = point;
    ctx.beginPath();
    ctx.fillStyle = "pink";
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    if (!isIn && !isTouching.value) {
      isIn = moveInTarget(mouseCurPos, type);
    }
    ctx.closePath();
  });
};

const moveInTarget = (pos: Position, type: ControlType) => {
  if (pos?.x === undefined || pos.y === undefined) return false;
  if (context.value?.isPointInPath(pos.x, pos.y)) {
    controlType.value = type;
    setMouseCursor(canvas.value!, type);
    return true;
  } else {
    setMouseCursor(canvas.value!, type);
    controlType.value = ControlType.Normal;
    canvas.value!.style.cursor = "auto";
  }
  return false;
};

const initCanvas = function () {
  if (canvas.value) {
    const { width: imgWidth, height: imgHeight } = imgInfo.value;
    const ratio = imgWidth / imgHeight;
    let styleWidth = width.value;
    let styleHeight = height.value;
    if (ratio > 1) {
      styleHeight = styleWidth / ratio;
    } else {
      styleWidth = styleHeight * ratio;
    }

    canvas.value.width = styleWidth;
    canvas.value.height = styleHeight;
    canvas.value.style.width = `${styleWidth}px`;
    canvas.value.style.height = `${styleHeight}px`;
    renderCanvas();
  }
};
const renderCanvas = function () {
  const { width: canvasWidth, height: canvasHeight } = canvas.value!;
  if (context.value) {
    context.value!.clearRect(0, 0, canvasWidth, canvasHeight);
    context.value.save();
    drawMask(context.value, canvasWidth, canvasHeight);
    drawClipRect(context.value, curMousePosition.value.x, curMousePosition.value.y);
    drawPicture(context.value, imgInfo.value.img!, canvasWidth, canvasHeight);
    context.value.restore();
  }
};

const generate = () => {
  const newCanvas = document.createElement("canvas");
  newCanvas.width = canvas.value!.width;
  newCanvas.height = canvas.value!.height;

  const newCtx = newCanvas.getContext("2d")!;
  drawPicture(newCtx, imgInfo.value.img!, canvas.value!.width, canvas.value!.height);
  const { x: clipX, y: clipY, width: clipWidth, height: clipHeight } = clipRect.value;
  const data = newCtx.getImageData(clipX, clipY, clipWidth, clipHeight);
  newCanvas.width = clipWidth;
  newCanvas.height = clipHeight;
  newCtx.clearRect(0, 0, clipWidth, clipHeight);
  newCtx.putImageData(data, 0, 0);
  document.body.appendChild(newCanvas);
};

watch(
  () => props.file,
  (file) => {
    if (file) {
      loadImage(file).then((res) => {
        imgInfo.value = res;
        nextTick(() => {
          initCanvas();
        });
      });
    }
  }
);
</script>
<style lang="less">
.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 300px;
  height: 300px;
  background: url("/src/assets/bg.jpg");
}
</style>

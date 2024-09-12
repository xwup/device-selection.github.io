<template>
  <div>
    <h1>机房设备信息登记V1</h1>
    <form id="dataForm">
      <label for="building">楼栋:</label>
      <input
        type="text"
        id="building"
        v-model="building"
        required
        oninput="this.value = this.value.toUpperCase().replace(/[^A-Z]/g, '').trim();"
      />

      <label for="room">房间:</label>
      <input
        type="text"
        id="room"
        v-model="room"
        required
        oninput="this.value = this.value.replace(/[^0-9]/g, '').trim();"
      />

      <label for="cabinetRow">机柜行:</label>
      <input
        type="text"
        id="cabinetRow"
        v-model="cabinetRow"
        required
        oninput="this.value = this.value.toUpperCase().replace(/[^A-Z]/g, '').trim();"
      />

      <label for="cabinetColumn">机柜列:</label>
      <input
        type="text"
        id="cabinetColumn"
        v-model="cabinetColumn"
        required
        oninput="this.value = this.value.replace(/[^0-9]/g, '').trim();"
      />

      <label for="deviceLayer">设备所在层(U):</label>
      <input
        type="text"
        id="deviceLayer"
        v-model="deviceLayer"
        required
        oninput="this.value = this.value.replace(/[^0-9-]/g, '').trim();"
      />

      <div id="previewContainer" v-if="showPreview">
        <video id="video" autoplay playsinline style="width: 100%; max-width: 320px"></video>
        <button id="takePhotoButton" class="inline-button" @click="takePhoto">拍照</button>
      </div>

      <label for="assetNumber">资产编号:</label>
      <input
        type="text"
        id="assetNumber"
        v-model="assetNumber"
        placeholder="扫描条形码"
        oninput="this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').trim();"
      />
      <button type="button" id="takePhoto" class="inline-button" @click="takePhotoAndRecognizeBarcode">拍照</button>

      <label for="assetImage">资产标签照片:</label>
      <input type="file" id="assetImage" name="assetImage" accept="image/*" />

      <div class="form-buttons">
        <button type="button" id="submitData" @click="submitData">录入</button>
        <button type="button" id="exportExcel" @click="exportExcel">导出Excel</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as XLSX from 'xlsx';

// 数据模型
const building = ref('');
const room = ref('');
const cabinetRow = ref('');
const cabinetColumn = ref('');
const deviceLayer = ref('');
const showPreview = ref(false);
const assetNumber = ref('');
const assetImageFile = ref(null);

// 拍照功能
let videoStream;
let videoElement = null;

// 拍照方法
const takePhoto = () => {
  if (videoElement && videoStream) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext('2d').drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/png');
    // 处理照片数据
    console.log(photoDataUrl);
  }
};

// 获取摄像头流
const startCamera = async () => {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement = document.getElementById('video');
    videoElement.srcObject = videoStream;
    showPreview.value = true;
  } catch (error) {
    console.error('Error accessing camera:', error);
  }
};

// 扫描条形码并拍照
const takePhotoAndRecognizeBarcode = () => {
  takePhoto();
  // 这里可以调用条形码识别的库或服务
  // 示例：识别条形码并设置 assetNumber
  assetNumber.value = '1234567890'; // 示例条形码
};

// 提交数据
const submitData = () => {
  // 提交数据逻辑
  console.log({
    building: building.value,
    room: room.value,
    cabinetRow: cabinetRow.value,
    cabinetColumn: cabinetColumn.value,
    deviceLayer: deviceLayer.value,
    assetNumber: assetNumber.value
  });
  // 可以在这里发送请求到后端保存数据
};

// 导出 Excel
const exportExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet([
    {
      building: building.value,
      room: room.value,
      cabinetRow: cabinetRow.value,
      cabinetColumn: cabinetColumn.value,
      deviceLayer: deviceLayer.value,
      assetNumber: assetNumber.value
    }
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  XLSX.writeFile(workbook, '机房设备信息.xlsx');
};

// 初始化摄像头
onMounted(() => {
  startCamera();
});
</script>

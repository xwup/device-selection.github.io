<template>
  <v-sheet class="mx-auto" width="300">
    <h1 class="my-4">机房信息登记</h1>
    <v-snackbar :timeout="3000" v-model="messageBox" :color="snackColor">
      {{ messageText }}

      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="messageBox = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
    <v-form @submit.prevent="handleRecord">
      <v-container width="100%">
        <v-row align="center" justify="center">
          <v-col style="padding: 0px;">
            <v-text-field v-model="building" :rules="buildingRules" label="楼栋号"></v-text-field>
          </v-col>
        </v-row>
        <v-row align="center" justify="center">
          <v-col style="padding: 0px;">
            <v-text-field v-model="room" :rules="roomRules" label="房间号"></v-text-field>
          </v-col>
        </v-row>
        <v-row align="center" justify="center">
          <v-col style="padding: 0px;">
            <v-text-field v-model="cabinet" :rules="cabinetRules" label="机柜"></v-text-field>
          </v-col>
        </v-row>
        <v-row align="center" justify="center">
          <v-col style="padding: 0px;">
            <v-text-field v-model="deviceLayer" :rules="deviceLayerRules" label="设备所在层(U)"></v-text-field>
          </v-col>
        </v-row>
        <v-row align="center" justify="center">
          <v-col style="padding: 0px;">
            <img style="width: 80%; height: 80%" :src="imgSrc" :style="{ display: imgShow ? 'block' : 'none' }" />
          </v-col>
        </v-row>
        <v-row align="center" justify="center">
          <v-col style="padding: 0px; width: 80%; flex-basis:auto;">
            <v-text-field v-model="assetNumber" label="资产编号"></v-text-field>
          </v-col>
          <v-col style="padding: 0px; width: 20%; flex-basis:auto;">
            <v-btn class="text-none mb-4" color="indigo-darken-3" @click="startScanning">拍条码
              <v-overlay class="my-overlay" v-model="overlayUpDown" activator="parent" :eager=true
                scroll-strategy="block">
                <!-- <v-container width="100%">
                  <v-row>
                    <v-col style="padding: 0px;">
                      <div id="interactive" class="viewport" :style="{ display: interactive ? 'block' : 'none' }"></div>
                    </v-col>
                  </v-row>
                  <v-row align="center" justify="center">
                    <v-col style="padding: 0px;">
                      <v-select max-width="300px" v-model="deviceSelect" label="镜头选择"
                        :style="deviceSelections.length > 0 ? { display: 'block' } : { display: 'none' }"
                        :items="deviceSelections" :item-props="deviceSellection" variant="solo" width="100%"></v-select>
                    </v-col>
                  </v-row>
                  <v-row align="center" justify="center">
                    <v-col style="padding: 0px; ">
                      <v-btn icon="mdi-close" @click="overlayUpDown = false"></v-btn>
                    </v-col>
                  </v-row>
                </v-container> -->
                <div id="interactive" class="viewport" :style="{ display: interactive ? 'block' : 'none' }"></div>
                <div class="viewport2">
                  <v-select max-width="300px" v-model="deviceSelect" label="镜头选择"
                    :style="deviceSelections.length > 0 ? { display: 'block' } : { display: 'none' }"
                    :items="deviceSelections" :item-props="deviceSellection" variant="solo" width="100%"></v-select>
                </div>
                <div class="viewport2">
                  <v-btn icon="mdi-close" @click="overlayUpDown = false"></v-btn>
                </div>
              </v-overlay>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
      <div class="d-flex justify-space-between mt-2">
        <v-btn @click="exportExcel" class="text-none mb-4" color="grey-lighten-3" size="x-large"
          variant="flat">导出</v-btn>
        <v-btn class="text-none mb-4" color="indigo-darken-3" size="x-large" variant="flat" type="submit">录入</v-btn>
      </div>
    </v-form>
  </v-sheet>
  <div id="error-message"></div>
</template>

<style>
.my-overlay {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
}

.my-overlay>.v-overlay__content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
}

.viewport2 {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 20%;
  overflow: hidden;
}

.viewport {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 60%;
  overflow: hidden;

  video {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: auto;
    height: 100%;
    object-fit: contain;
    /* 保证不裁剪 */
  }

  canvas {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: auto;
    height: 100%;
  }

  /* canvas.drawingBuffer,
  video.drawingBuffer {
    margin-left: -640px;
  } */
}
</style>

<script>
import { ref, watch } from 'vue';
import ExcelJS from 'exceljs';
import Quagga from 'quagga';
import { Buffer } from 'buffer';
import * as FileSaver from "file-saver";

export default {
  watch: {
    overlayUpDown(newValue, oldValue) {
      // console.log('overlayUpDown', newValue)
      if (!newValue) {
        Quagga.stop();
        this.overlayUpDown = false;
      }
    },
    // 监听设备选择
    async deviceSelect(newValue, oldValue) {
      const selectedItem = this.deviceSelections.find(item => item.title === newValue);
      this.messageAlert('当前镜头为:' + selectedItem.title, this.tipAlert);
      this.options.inputStream.constraints['deviceId'] = selectedItem.subtitle;
      Quagga.stop();
      try {
        await this.delay(50);
      } catch (error) {
        console.error(error);
      }
      this.startScanning();
    }
  },

  setup() {
    // 扫描相关
    const EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const deviceSelections = ref([]);
    const deviceSelect = ref('');
    const interactive = ref(false);
    const imgShow = ref(false);
    const imgSrc = ref('');
    let options = {
      inputStream: {
        debug: { showCanvas: true, showPatches: true, showFoundPatches: true, drawBoundingBox: true, drawScanline: true },
        type: "LiveStream",
        // target: "#interactive", // 可以指定视频输出的容器，也可以不设置会自动查找 class=viewport的元素作为容器
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          facingMode: "environment",
          aspectRatio: { min: 1, max: 2 },
          deviceId: Quagga.CameraAccess.getActiveStreamLabel()
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 4,
      frequency: 10,
      decoder: {
        //
        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_vin_reader", "codabar_reader"]
      },
      locate: true
    }

    // 存数据相关
    const building = ref('');
    const room = ref('');
    const cabinet = ref('');
    const deviceLayer = ref('');
    const assetNumber = ref('');
    const assetImage = ref('');
    const messageBox = ref(false);
    const messageText = ref('');
    const snackColor = ref('');
    const overlayUpDown = ref(false);
    // 存储录入的数据
    const recordedData = ref([]);
    const successAlert = "#4CAF50";
    const errorAlert = "#F44336";
    const tipAlert = "#FFC107";
    // 规则定义
    const buildingRules = [
      value => {
        if (value && value.length === 1 && value.match(/[A-Za-z]/)) {
          building.value = value.toUpperCase();
          return true;
        }
        return '楼栋号必须是单个大写字母';
      },
    ];
    const roomRules = [
      value => {
        if (value && value.match(/^\d+$/)) {
          return true;
        }
        return '房间号只能是数字';
      },
    ];
    const cabinetRules = [
      value => {
        if (value && value.match(/^[A-Za-z]+\d+$/)) {
          cabinet.value = value.toUpperCase();
          return true;
        }
        return '机柜必须是大写字母加数字组合';
      },
    ];
    const deviceLayerRules = [
      value => {
        if (value && value.match(/^\d+(-\d+)?$/)) {
          return true;
        }
        return '设备所在层只能是数字或数字-数字';
      },
    ];
    const messageAlert = (text, type) => {
      messageBox.value = true;
      messageText.value = text;
      snackColor.value = type;
    };
    const isBoolean = (value) => {
      return typeof value === 'boolean';
    };
    // 录入数据
    const handleRecord = () => {
      if (!isBoolean(buildingRules[0](building.value)) ||
        !isBoolean(roomRules[0](room.value)) ||
        !isBoolean(cabinetRules[0](cabinet.value)) ||
        !isBoolean(deviceLayerRules[0](deviceLayer.value))) {
        messageAlert('请检查所有输入项是否符合要求', errorAlert);
        return;
      }
      const defaultAssetNumber = `${building.value}${room.value}-${cabinet.value}-${deviceLayer.value}无资产编号`;
      const newData = {
        building: building.value,
        room: room.value,
        cabinet: cabinet.value,
        deviceLayer: deviceLayer.value,
        assetNumber: assetNumber.value || defaultAssetNumber,
        assetImage: assetImage.value || '',
      };
      // 检查资产编号是否重复
      const isDuplicate = recordedData.value.some(record => record.assetNumber === newData.assetNumber);
      if (isDuplicate) {
        messageAlert('已存在重复资产', errorAlert);
        return;
      }
      recordedData.value.push(newData);
      messageAlert('录入成功', successAlert);
      // 不再清空输入框
      assetImage.value = '';
      imgShow.value = false;
      saveRecordedData(); // 保存数据
    };

    // 解析 dataUrl 并获取图片的长宽
    const getImageDimensions = async (dataUrl) => {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          resolve({ imgWidth: image.width, imgHeight: image.height });
        };
        image.onerror = (error) => {
          reject(error);
        };
        image.src = dataUrl;
      });
    }
    // 导出 Excel
    const exportExcel = async () => {
      const data = recordedData.value
      // 创建一个新的工作簿
      const workbook = new ExcelJS.Workbook();
      // 创建一个新的工作表
      const worksheet = workbook.addWorksheet('Sheet1');

      // 添加表头
      worksheet.columns = [
        { header: '楼栋', key: 'building', width: 10 },
        { header: '房间', key: 'room', width: 10 },
        { header: '机柜', key: 'cabinet', width: 10 },
        { header: '设备所在层', key: 'deviceLayer', width: 10 },
        { header: '资产编号', key: 'assetNumber', width: 10 },
        { header: '资产图片', key: 'assetImage', width: 10 }
      ];

      // // 遍历数据对象，并将图片插入到Excel单元格中
      // data.forEach(async (item, index) => {
      // 遍历数据对象，并将图片插入到Excel单元格中
      for (let index = 0; index < data.length; index++) {
        const item = data[index];
        worksheet.addRow({ building: item.building, room: item.room, cabinet: item.cabinet, deviceLayer: item.deviceLayer, assetNumber: item.assetNumber })
        // 获取图片的dataUrl
        const imageData = item.assetImage;
        if (imageData && imageData.startsWith('data:image/')) {
          let imgWidth, imgHeight = 0
          try {
            // 获取图片的长宽
            await getImageDimensions(imageData).then((metadata) => {
              imgWidth = metadata.imgWidth / 5
              imgHeight = metadata.imgHeight / 5
              const thisRow = worksheet.getRow(index + 2)
              thisRow.height = imgHeight
            });

          } catch (error) {
            console.error('Error processing images:', error);
          }
          // 创建image对象
          const imageObj = workbook.addImage({
            base64: imageData,
            width:imgWidth,
            height:imgHeight,
            extension: 'png',
          });
          worksheet.addImage(imageObj, {
            tl: { col: 5, row: index + 1 },
            ext: { width: imgWidth, height: imgHeight },
          });
        }
      };
      worksheet.eachRow((row, rowNumber) => {
        row.alignment = {
          vertical: 'middle',
          horizontal: 'center',
        }
      })
      // 写入Excel文件到Buffer
      workbook.xlsx.writeBuffer().then((data) => {

        const blob = new Blob([data], { type: EXCEL_TYPE });

        FileSaver.saveAs(blob, "机房设备信息.xlsx");

      });

      //   const data = recordedData.value
      //   // 创建一个新的工作簿
      //   const workbook = XLSX.utils.book_new();

      //   // 创建一个新的工作表
      //   const worksheet = XLSX.utils.json_to_sheet(['楼栋', '房间', '机柜', '设备所在层', '资产编号', '资产图片']);

      //   // 循环数据行，将图片插入到相应的单元格中
      //   data.forEach((item, index) => {
      //     // 获取图片的dataUrl
      //     const imageData = item.assetImage;

      //     if (imageData && imageData.startsWith('data:image/')) {
      //       // 解析dataUrl
      //       const base64Image = imageData.split(',')[1];
      //       const buffer = new Buffer(base64Image, 'base64');

      //       /// 计算图片插入的位置
      //       const rowIndex = index + 1; // 从第二行开始
      //       const columnIndex = 5; // 第5列（Image）

      //       // 确保单元格存在
      //       const cellAddress = XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex });

      //       // 初始化单元格
      //       let cell = worksheet[cellAddress];
      //       if (!cell) {
      //         cell = XLSX.utils.format_cell({ t: 's', v: '' });
      //         worksheet[cellAddress] = cell;
      //       }

      //       // 创建图片对象
      //       const image = {
      //         image: buffer,
      //         ext: 'png', // 图片格式
      //         options: {
      //           // 图片在单元格中的位置
      //           anchor: XLSX.utils.encode_range({
      //             s: { r: rowIndex, c: columnIndex }, // 开始行和列
      //             e: { r: rowIndex, c: columnIndex } // 结束行和列
      //           }),
      //           editAs: 'oneCell', // 编辑方式
      //         }
      //       };

      //       // 插入图片到Excel单元格
      //       cell.M = image;
      //     }
      //     // 添加其他列的数据
      //     worksheet[XLSX.utils.encode_cell({ c: 0, r: index + 1 })] = { v: item.building };
      //     worksheet[XLSX.utils.encode_cell({ c: 1, r: index + 1 })] = { v: item.room };
      //     worksheet[XLSX.utils.encode_cell({ c: 2, r: index + 1 })] = { v: item.cabinet };
      //     worksheet[XLSX.utils.encode_cell({ c: 3, r: index + 1 })] = { v: item.deviceLayer };
      //     worksheet[XLSX.utils.encode_cell({ c: 4, r: index + 1 })] = { v: item.assetNumber };
      //   })
      //   // 添加工作表到工作簿
      //   XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      //   // 写入Excel文件
      //   XLSX.writeFile(workbook, '机房设备信息.xlsx');

      //   // const worksheet = XLSX.utils.json_to_sheet(recordedData.value);
      //   // const workbook = XLSX.utils.book_new();
      //   // XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      //   // XLSX.writeFile(workbook, '机房设备信息.xlsx');
      saveRecordedData(); // 保存数据
    };

    const delay = (ms) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    }


    /**
         * 初始化摄像头选择
         * 返回一个Promise对象，该对象在摄像头设备枚举完成后解析
         */
    const initCameraSelection = () => {
      return Quagga.CameraAccess.enumerateVideoDevices()
        .then(function (devices) {
          function pruneText(text) {
            return text.length > 30 ? text.substr(0, 30) : text;
          }
          deviceSelections.value = [];
          devices.forEach(function (device) {
            deviceSelections.value.push({ title: pruneText(device.label), subtitle: device.deviceId });
          });
          options.inputStream.constraints['deviceId'] = deviceSelections.value[deviceSelections.value.length - 1].subtitle;
        });
    };


    // const clickScan = async () => {
    //   console.log(options)
    //   try {
    //     startScanning();
    //     await initCameraSelection().then(() => {
    //       // if (deviceSelections.value.length > 1) {
    //       //   deviceSelect.value = deviceSelections.value[deviceSelections.value.length - 1].title;
    //       // }
    //     });
    //   } catch (error) {
    //     console.error('Error:', error);
    //   }
    // }

    const startScanning = () => {

      imgShow.value = false;
      interactive.value = true;
      let lastResult = '';
      // console.log('Start scanning...');
      Quagga.init(options, function (err) {
        if (err) {
          console.log('num', num, err);
          num += 1;
          return;
        }
        Quagga.start();
      });


      Quagga.onDetected(function (result) {
        if (lastResult !== result.codeResult.code) {
          lastResult = result.codeResult.code;
          assetNumber.value = result.codeResult.code
          // 关闭遮罩
          overlayUpDown.value = false
          interactive.value = false;

          messageAlert('识别成功', successAlert);
          let canvas = Quagga.canvas.dom.image;
          imgSrc.value = canvas.toDataURL();
          imgShow.value = true;
          assetImage.value = imgSrc.value
          // 关闭视频
          Quagga.stop();
        }
      });
      // 处理识别过程数据，在视频图像上画线/画框
      Quagga.onProcessed(function (result) {
        const drawingCtx = Quagga.canvas.ctx.overlay,
          drawingCanvas = Quagga.canvas.dom.overlay;
        if (result) {
          if (result.boxes) {
            drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
            result.boxes.filter(function (box) {
              return box !== result.box;
            }).forEach(function (box) {
              Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
            });
          }

          if (result.box) {
            Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 });
          }

          if (result.codeResult && result.codeResult.code) {
            Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
          }
        }
      });
    };
    // 加载 localStorage 中的数据
    const loadRecordedData = () => {
      const savedData = localStorage.getItem('recordedData');
      if (savedData) {
        recordedData.value = JSON.parse(savedData);
      }
    };
    // 保存数据到 localStorage
    const saveRecordedData = () => {
      localStorage.setItem('recordedData', JSON.stringify(recordedData.value));
    };
    return {
      building,
      messageBox,
      messageText,
      snackColor,
      room,
      cabinet,
      deviceLayer,
      assetNumber,
      buildingRules,
      roomRules,
      cabinetRules,
      deviceLayerRules,
      handleRecord,
      exportExcel,
      overlayUpDown,
      deviceSelections,
      deviceSelect,
      delay,
      // 扫描相关
      startScanning,
      interactive,
      imgSrc,
      imgShow,
      // clickScan,
      options,
      messageAlert,
      tipAlert,
      initCameraSelection,
      loadRecordedData,
    };
  },
  methods: {
    deviceSellection(item) {
      return {
        title: item.title,
        subtitle: item.subtitle
      }
    }
  },
  mounted() {
    this.initCameraSelection();
    this.loadRecordedData();
  }
};

</script>

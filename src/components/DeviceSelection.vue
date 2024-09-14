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
            <img style="width: 80%; height: 80%" :src="imgSrc" :style="{display: imgShow ? 'block' : 'none'}" />
          </v-col>
        </v-row>
        <v-row align="center" justify="center">
          <v-col style="padding: 0px; width: 80%; flex-basis:auto;">
            <v-text-field v-model="assetNumber" label="资产编号"></v-text-field>
          </v-col>
          <v-col style="padding: 0px; width: 20%; flex-basis:auto;">
            <v-btn class="text-none mb-4" color="indigo-darken-3" @click="startScanning">拍条码
              <v-overlay v-model="overlayUpDown" activator="parent" :eager=true scroll-strategy="block"
                style="justify-items: center; align-items: center;">
                <div id="interactive" class="viewport"  :style="{ display: interactive ? 'block' : 'none' }"></div>

                <v-select max-width="300px" v-model="deviceSelect" label="镜头选择"
                  :style="deviceSelections.length > 0 ? { display: 'block' } : { display: 'none' }"
                  :items="deviceSelections" :item-props="deviceSellection" variant="solo" width="100%"></v-select>


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
#interactive.viewport {
  width: 640px;
  height: 480px;

  canvas,
  video {
    float: left;
    width: 640px;
    height: 480px;
  }

  canvas.drawingBuffer,
  video.drawingBuffer {
    margin-left: -640px;
  }
}
</style>

<script>
import { ref, watch } from 'vue';
import * as XLSX from 'xlsx';
import Quagga from 'quagga';

export default {
  watch: {
    overlayUpDown(newValue, oldValue) {
      console.log('overlayUpDown', newValue)
      if (!newValue) {
        this.stopScanning();
      }
    },
    // 监听设备选择
    deviceSelect(newValue, oldValue) {
      console.log(newValue)
      this.options.inputStream.constraints.deviceId = newValue;
      this.stopScanning();
      this.startScanning();
    }
  },
  data() {
    return {
      state:
      // 定义应用的各种状态和配置
      {
        // 定义输入流的配置
        inputStream: {
          type: "LiveStream", // 输入流类型为实时流
          constraints: { // 输入流的约束条件
            width: { min: 640 }, // 宽度最小值为640像素
            height: { min: 480 }, // 高度最小值为480像素
            aspectRatio: { min: 1, max: 100 }, // 长宽比的最小和最大值
            facingMode: "environment" // 摄像头面向环境，也可以是用户
          }
        },
        // 定义定位器的配置
        locator: {
          patchSize: "medium", // 中等大小的补丁
          halfSample: true // 使用半采样
        },
        // 定义工作线程的数量
        numOfWorkers: 2,
        // 定义频率为每秒10次
        frequency: 10,
        // 定义解码器的配置
        decoder: {
          readers: [{ // 解码器的读取配置
            format: "code_128_reader", // 使用的格式为code 128读取器
            config: {} // 空的配置对象
          }]
        },
        // 是否启用定位
        locate: true
      },
    }
  },
  setup() {
    // 扫描相关
    const deviceSelections = ref([{ title: 'sdfgsd', subtitle: '39s88g90s0' }, { title: 'fhhsdf', subtitle: '4436gt422' }]);
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
            aspectRatio: { min: 1, max: 2 }
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
          readers: ["code_128_reader","ean_reader", "ean_8_reader", "code_39_vin_reader", "codabar_reader"]
        },
        locate: true
      }

    // 存数据相关
    const building = ref('');
    const room = ref('');
    const cabinet = ref('');
    const deviceLayer = ref('');
    const assetNumber = ref('');
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
        assetNumber: assetNumber.value || defaultAssetNumber
      };
      // 检查资产编号是否重复
      const isDuplicate = recordedData.value.some(record => record.assetNumber === newData.assetNumber);
      if (isDuplicate) {
        messageAlert('已存在重复资产', errorAlert);
        return;
      }
      recordedData.value.push(newData);
      messageAlert('录入成功', successAlert);
      console.log('Recorded Data:', recordedData.value);
      // 不再清空输入框
    };
    // 导出 Excel
    const exportExcel = () => {
      const worksheet = XLSX.utils.json_to_sheet(recordedData.value);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, '机房设备信息.xlsx');
    };

    /**
         * 初始化摄像头选择
         * 返回一个Promise对象，该对象在摄像头设备枚举完成后解析
         */
    const initCameraSelection = () => {
      let streamLabel = Quagga.CameraAccess.getActiveStreamLabel();
      console.log(streamLabel)
      console.log(deviceSelections.value)

      return Quagga.CameraAccess.enumerateVideoDevices()
        .then(function (devices) {
          function pruneText(text) {
            return text.length > 30 ? text.substr(0, 30) : text;
          }
          deviceSelections.value = [];
          devices.forEach(function (device) {
            deviceSelect.value = streamLabel
            deviceSelections.value.push({ title: pruneText(device.label), subtitle: device.id });
          });
        });
    };

    const stopScanning = () => {
      Quagga.stop();
      interactive.value = false;
    };
    const startScanning = () => {
      let lastResult = '';
      imgShow.value = false;
      interactive.value = true;
      // console.log('Start scanning...');

      Quagga.init(options, function (err) {
        if (err) {
          console.log(err)
          // console.error(err)
          // return
        }
        initCameraSelection();

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
            // 关闭视频
            Quagga.stop();
          }
        });

        Quagga.start();

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
      // 扫描相关
      startScanning,
      interactive,
      imgSrc,
      imgShow,
      stopScanning,
      options,
    };
  },
  methods: {
    deviceSellection(item) {
      return {
        title: item.title,
        subtitle: item.subtitle
      }
    }
  }
};

</script>

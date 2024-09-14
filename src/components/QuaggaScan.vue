<template>
  <div id="interactive" class="viewport"></div>
  <v-select
  :style="deviceSelection.length > 0 ? { display: 'block' } : { display: 'none' }"
  label="镜头选择"
  :items="deviceSelection"
></v-select>
</template>

<script>

export default {
  name: 'QuaggaScan',

  data() {
    return {
      // 定义应用的各种状态和配置
      state: {
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

    const deviceSelection = ref([]);
    // const init = () => {
    //   // 尝试初始化Quagga，如果出错则打印错误信息并返回
    //   Quagga.init(this.state, function (err) {
    //     if (err) {
    //       console.log(err);
    //       return;
    //     }
    //     // 初始化成功后，附加事件监听器
    //     attachListeners();
    //     // 检查当前活动轨道的能力
    //     checkCapabilities();
    //     // 开始Quagga相机监控
    //     Quagga.start();
    //   });
    // };
    // const attachListeners = () => {
    //   // 初始化相机选择功能
    //   initCameraSelection();
    // };

    // const initCameraSelection = () => {

    //   return Quagga.CameraAccess.enumerateVideoDevices()
    //     .then(function (devices) {
    //       function pruneText(text) {
    //         return text.length > 30 ? text.substr(0, 30) : text;
    //       }

    //       devices.forEach(function (device) {
    //         deviceSelection.appendChild(device.deviceId || device.id);
    //       });
    //     });
    // }


    return {
      // initCameraSelection,
      deviceSelection
    }
  },
  created() {
  }
}
</script>

// script.js
document.addEventListener('DOMContentLoaded', function() {
    let submittedData = localStorage.getItem('submittedData') ? JSON.parse(localStorage.getItem('submittedData')) : [];
    const statusMessage = document.getElementById('statusMessage');

    // 条形码扫描函数
    function startBarcodeScanner() {
        Quagga.init({
            inputStream : {
                name : "Live",
                type : "LiveStream",
                target: document.querySelector('#scannerContainer'), // 需要指定一个元素作为扫描区域
                constraints: {
                    width: 320,
                    height: 240,
                    facingMode: "environment"
                }
            },
            decoder : {
                readers : ["ean_reader"]
            }
        }, function(err) {
            if (err) {
                console.log(err);
                return
            }
            console.log("Initialization finished. Ready to start");
            Quagga.start();
        });

        Quagga.onDetected(function(result) {
            const code = result.codeResult.code;
            document.getElementById('assetNumber').value = code;
            Quagga.stop();
        });
    }

    // 录入数据按钮事件
    document.getElementById('submitData').addEventListener('click', function() {
        // 获取表单数据
        const building = document.getElementById('building').value;
        const room = document.getElementById('room').value;
        const cabinetRow = document.getElementById('cabinetRow').value;
        const cabinetColumn = document.getElementById('cabinetColumn').value;
        const deviceLayer = document.getElementById('deviceLayer').value;
        const assetNumber = document.getElementById('assetNumber').value;

        // 检查是否已经提交过相同资产编号的数据
        const isDuplicate = submittedData.some(item => item.assetNumber === assetNumber);
        if (isDuplicate) {
            alert('此资产编号已提交，请勿重复提交！');
            return;
        }

        // 将新数据添加到已提交数据数组中
        submittedData.push({
            building: building,
            room: room,
            cabinetRow: cabinetRow,
            cabinetColumn: cabinetColumn,
            deviceLayer: deviceLayer,
            assetNumber: assetNumber
        });

        // 保存数据到localStorage
        localStorage.setItem('submittedData', JSON.stringify(submittedData));

        // 显示录入时间和当前录入信息条数
        const now = new Date().toLocaleString();
        const count = submittedData.length;
        statusMessage.innerHTML = `录入时间: ${now}, 当前录入信息条数: ${count}`;

        // 保留上次提交的内容
        document.getElementById('building').value = building;
        document.getElementById('room').value = room;
        document.getElementById('cabinetRow').value = cabinetRow;
        document.getElementById('cabinetColumn').value = cabinetColumn;
        document.getElementById('deviceLayer').value = deviceLayer;
        document.getElementById('assetNumber').value = assetNumber;
    });

    // 导出Excel按钮事件
    document.getElementById('exportExcel').addEventListener('click', function() {
        // 创建一个工作簿对象
        const workbook = XLSX.utils.book_new();

        // 创建一个工作表对象
        const worksheet = XLSX.utils.json_to_sheet(submittedData, {
            header: ['楼栋', '房间', '机柜行', '机柜列', '设备所在层', '资产编号']
        });

        // 将工作表添加到工作簿中
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        // 生成Excel文件名
        const building = document.getElementById('building').value;
        const room = document.getElementById('room').value;
        const fileName = `${building}${room}设备信息.xlsx`;

        // 生成Excel文件
        XLSX.writeFile(workbook, fileName);

        // 询问是否清除历史数据
        const shouldClear = confirm('导出成功！是否清除历史数据？');
        if (shouldClear) {
            // 清除历史数据
            submittedData = [];
            localStorage.removeItem('submittedData');
            statusMessage.innerHTML = '历史数据已清除';
        } else {
            statusMessage.innerHTML = '历史数据未清除';
        }
    });

    // 条形码扫描按钮事件
    document.getElementById('scanBarcode').addEventListener('click', function() {
        startBarcodeScanner();
    });
});
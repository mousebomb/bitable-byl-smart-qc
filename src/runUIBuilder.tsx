import {bitable, IOpenCellValue, UIBuilder} from "@lark-base-open/js-sdk";
import Config from "./Config";


export default async function main(uiBuilder: UIBuilder) {
    // 先获取表格
    const recordTable = await bitable.base.getTable(Config.TAB_NAME_PROCESS_CHECKRECORD);
    const statsTable = await bitable.base.getTable(Config.TAB_NAME_PROCESS_STATS);
    if (!recordTable || !statsTable) {
        uiBuilder.message.error(`检测不到表,请检查表名是否正确`);
        return;
    }
    const recordOrderRefField = await recordTable.getField(Config.FIELD_RECORD_OrderRef);
    const recordDateField = await recordTable.getField(Config.FIELD_RECORD_DATE);
    const statsOrderNoField = await statsTable.getField(Config.FIELD_STATS_OrderNo);
    const statsDateField = await statsTable.getField(Config.FIELD_STATS_DATE);
    const recordDoneField = await recordTable.getField(Config.FIELD_RECORD_DONE);
    console.log("default/main",recordOrderRefField,recordDateField,statsOrderNoField,statsDateField,recordDoneField);
    if (!recordOrderRefField || !recordDateField || !statsOrderNoField || !statsDateField || !recordDoneField) {
        uiBuilder.message.error(`检测不到字段,请检查字段名是否正确`);
        return;
    }


    uiBuilder.text("一键更新统计表");
    uiBuilder.form(form => ({
        formItems: [],
        buttons: ['更新统计表'],
    }), async ({values}) => {

        //显示加载
        uiBuilder.showLoading('插入中，请不要重复点击，以免造成数据错误...');
        let workLog = "";


        //获取表格数据
        const recordRecordIds = await recordTable.getRecordIdList();
        // 先分析，找出各种组合的 不重复的 orderNo 和 date组合联合唯一，且isDone为false
        let statsOrderNos = new Set<string>();
        let statsDates = new Set<IOpenCellValue>();


        // 遍历所有记录
        for (let recordId of recordRecordIds) {
            //获取记录
            if (!recordId) {
                console.warn("default/flushData", "recordId is null");
                continue;
            }
            //目标已写入过则去重
            const isDone = await recordTable.getCellValue(recordDoneField.id,recordId);
            if (isDone)
            {
                continue;
            }
            var orderNoVal=await recordTable.getCellString(recordOrderRefField.id, recordId);
            var dateVal=await recordTable.getCellValue(recordDateField.id, recordId);

            if (!orderNoVal || !dateVal) {
                console.warn("default/flushData", "orderNoVal is null");
                continue;
            }
            //去重
            if (!statsOrderNos.has(orderNoVal))
                statsOrderNos.add(orderNoVal);
            if (!statsDates.has(dateVal))
                statsDates.add(dateVal);
            //标记已插入
            await recordTable.setCellValue( recordDoneField.id,recordId,true);

        }
        workLog += "已分析出"+statsOrderNos.size+"个订单号，"+statsDates.size+"个日期\n";
        // console.log("default/分析完毕",statsOrderNos,statsDates);

        //便利所有已统计的表行
        let statsAlreadyGroup = new Set<string>();
        const statsRecordIds = await statsTable.getRecordIdList();
        for (let statsRecordId of statsRecordIds) {
            //获取记录
            if (!statsRecordId) {
                console.warn("default/flushData", "statsRecordId is null");
                continue;
            }
            //目标已存在则去重
            const orderNoVal = await statsTable.getCellString(statsOrderNoField.id, statsRecordId);
            const dateVal = await statsTable.getCellValue(statsDateField.id, statsRecordId);
            if (!orderNoVal || !dateVal) {
                console.warn("default/flushData", "orderNoVal is null");
                continue;
            }
            //记录要去重的已存在组合
            statsAlreadyGroup.add(orderNoVal +"_"+ dateVal);
        }

        // 写入数据，
        let done = 0;
        let max = statsOrderNos.size * statsDates.size;
        for (let orderNo of statsOrderNos)
        {
            for (let date of statsDates)
            {
                done++;
                // 需要检测统计表里没有这个组合
                if(statsAlreadyGroup.has(orderNo +"_"+ date))
                {
                    var str = '跳过'+orderNo+date+","+ done + "/" + max;
                    workLog += str + "\n";
                    uiBuilder.showLoading(str + '，请不要重复点击，以免造成数据错误...');
                    continue;
                }

                var str = '插入'+orderNo+date+","+ done + "/" + max ;
                workLog += str + "\n";
                uiBuilder.showLoading(str+ '，请不要重复点击，以免造成数据错误...');
                // 写入统计表
                const statsRecordId = await statsTable.addRecord({
                    fields: {
                        [statsOrderNoField.id]: orderNo,
                        [statsDateField.id]: date,
                    }
                });
            }
        }

        uiBuilder.hideLoading();
        uiBuilder.message.success(`已经写入完毕`);

        uiBuilder.clear();
        uiBuilder.markdown(`**自动写入统计表**
 已执行完毕，请关闭或重新运行
 \`\`\`
 ${workLog}
 \`\`\``);
    });
}

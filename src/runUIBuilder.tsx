import {bitable, DateFormatter, IOpenCellValue, UIBuilder} from "@lark-base-open/js-sdk";
import Config from "./Config";
import StatsUniqueGroup from "./StatsUniqueGroup";


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
    const statsCheJianField = await statsTable.getField(Config.FIELD_STATS_CheJian);
    const recordCheJianField = await recordTable.getField(Config.FIELD_RECORD_CheJian);
    console.log("default/main",recordOrderRefField,recordDateField,statsOrderNoField,statsDateField,recordDoneField,statsCheJianField,recordCheJianField);
    if (!recordOrderRefField || !recordDateField || !statsOrderNoField || !statsDateField || !recordDoneField || !statsCheJianField || !recordCheJianField) {
        uiBuilder.message.error(`检测不到字段,请检查字段名是否正确`);
        return;
    }


    uiBuilder.text("一键更新统计表v1.0");
    uiBuilder.form(form => ({
        formItems: [],
        buttons: ['更新统计表'],
    }), async ({values}) => {

        //显示加载
        uiBuilder.showLoading('插入中，请不要重复点击，以免造成数据错误...');
        let workLog = "";


        //获取表格数据
        const recordRecordIds = await recordTable.getRecordIdList();
        // 先分析，找出各种组合的 不重复的  cheJian , orderNo 和 date组合联合唯一，且isDone为false
        let statsUniqueGroups = new Map<string,StatsUniqueGroup>();


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
            var cheJianVal=await recordTable.getCellString(recordCheJianField.id, recordId);

            if (!orderNoVal || !dateVal) {
                console.warn("default/flushData", "orderNoVal is null");
                continue;
            }
            //记录已存在的各种组合
            var group = new StatsUniqueGroup(orderNoVal,dateVal,cheJianVal);

            if(!statsUniqueGroups.has(group.key))
                statsUniqueGroups.set(group.key,group);

            //标记已插入
            await recordTable.setCellValue( recordDoneField.id,recordId,true);

        }
        workLog += "已分析出新纪录的" + statsUniqueGroups.size+"个组合\n";
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
            const cheJianVal = await statsTable.getCellString(statsCheJianField.id, statsRecordId);
            if (!orderNoVal || !dateVal || !cheJianVal) {
                console.warn("default/flushData", "orderNoVal is null");
                continue;
            }
            //记录要去重的已存在组合
            statsAlreadyGroup.add(cheJianVal +"_"+orderNoVal +"_"+ dateVal);
        }

        // 写入数据，
        let done = 0;
        let max = statsUniqueGroups.size;
        for (let kvp of statsUniqueGroups)
        {
            let eachStatsUniqueGroup = kvp[1];
            done++;
            // 需要检测统计表里没有这个组合
            if(statsAlreadyGroup.has(eachStatsUniqueGroup.cheJian+"_"+eachStatsUniqueGroup.orderNo +"_"+ eachStatsUniqueGroup.dateVal))
            {
                var str = '跳过'+eachStatsUniqueGroup.cheJian +"_"+eachStatsUniqueGroup.orderNo+"_"+eachStatsUniqueGroup.dateVal+","+ done + "/" + max;
                workLog += str + "\n";
                uiBuilder.showLoading(str + '，请不要重复点击，以免造成数据错误...');
                continue;
            }

            var str = '插入'+eachStatsUniqueGroup.cheJian +"_"+eachStatsUniqueGroup.orderNo+"_"+eachStatsUniqueGroup.dateVal+","+ done + "/" + max ;
            workLog += str + "\n";
            uiBuilder.showLoading(str+ '，请不要重复点击，以免造成数据错误...');
            // 写入统计表
            const statsRecordId = await statsTable.addRecord([await statsCheJianField.createCell(eachStatsUniqueGroup.cheJian), await statsOrderNoField.createCell(eachStatsUniqueGroup.orderNo), await statsDateField.createCell(eachStatsUniqueGroup.dateVal)]);
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

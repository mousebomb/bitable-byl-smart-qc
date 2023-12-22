export default class Config {
    //表格名
    public static TAB_NAME_PROCESS_CHECKRECORD: string = "制程 - 检验记录 Process - Check Record";
    public static TAB_NAME_PROCESS_STATS : string = "制程 - 各车间每日订单抽检数量统计 (自动) Process - Daily Sampling Qty（Auto）";

    //检查记录
    public static FIELD_STATS_DATE: string = "日期";
    public static FIELD_STATS_OrderNo: string = "订单号";
    public static FIELD_STATS_CheJian: string = "分类车间";

    public static FIELD_RECORD_DATE: string = "创建日期";
    public static FIELD_RECORD_OrderRef: string = "订单号";
    public static FIELD_RECORD_CheJian: string = "车间类别";
    public static FIELD_RECORD_DONE: string = "已自动插入统计";


}
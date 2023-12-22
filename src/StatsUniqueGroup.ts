import {IOpenCellValue} from "@lark-base-open/js-sdk";

export default class StatsUniqueGroup {
    constructor(orderNo: string, dateVal: IOpenCellValue, cheJian: string) {
        this.orderNo = orderNo;
        this.dateVal = dateVal;
        this.cheJian = cheJian;

        this.key = `${this.orderNo}_${this.dateVal?.toString()}_${this.cheJian}`;
    }
    public orderNo: string;
    public dateVal: IOpenCellValue;
    public cheJian: string;


    public key : string;

}
import { bitable, UIBuilder } from "@lark-base-open/js-sdk";

const table = await bitable.base.getActiveTable();

export default async function main(uiBuilder: UIBuilder) {
  uiBuilder.form(form => ({
    formItems: [
        form.tableSelect('table', {label:'选择数据表'}),
        form.fieldSelect('field', {label: '选择字段', sourceTable: 'table', mode: 'multiple'}),
        form.input('findText', {label: '输入查找的文本'}),
        form.input('replaceText', {label: '替换为'}),
    ],
    buttons: ['确认'],
  }), async ({ values }) => {
    const { table, field, findText, replaceText } = values;
    // 省略查找的代码
    uiBuilder.text(`查找到 n 条记录`);
    uiBuilder.buttons('是否替换', ['确定'], () => {
        // 省略替换的代码
    });
  });
}

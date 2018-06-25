/**
 * Created by 17073565 on 2018/5/7.
 */
//常用正则校验
//身份证校验
    //2代身份证
let isTrue = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
console.log(isTrue.test(342221199301265031));

//1代身份证
let isTrue = /^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$/;

//手机号码正则表达式
let isTelPhone = /^(13[0-9]|14[5-9]|15[0123456789]|166|17[0-8]|18[0-9]|19[8-9])[0-9]{8}$/

//邮箱正则校验
let isMail = /^([A-Za-z0-9_\-\.\u4e00-\u9fa5])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,8})$/

//用户名正则 用户名正则，4到16位（字母，数字，下划线，减号）
let isName = /^[a-zA-Z0-9_-]{4,16}$/

//密码正则  以字母开头，长度在6~18之间，只能包含字母、数字和下划线
let isPassword = /^[a-zA-Z0-9]\w{5,17}$/

//强密码正则 最少6位 包含至少1个大写字母 1个小写字母 1个数字 1个特殊字符
let isPasswordOfS = /^.*(?=.{6,})(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*? ]).*$/;

//qq号正则
let isQq = /^[1-9][0-9]{4,10}$/

//微信号正则  6至20位，以字母开头，字母，数字，减号，下划线
let isWechat = /^[a-zA-Z]([-_a-zA-Z0-9]{5,19})+$/

//特殊字符正则
let isTrue = /["'<>%;)(&+]+-!@#$~/

//包含中文正则
let hasChinese = /[\u4E00-\u9FA5]/

//固定电话正则
let isTelPhone = /(\(\d{3,4}\)|\d{3,4}-|\s)?\d{8}/

//IP正则
let isIP = /\d+\.\d+\.\d+\.\d+/

//邮编正则  6位数字
let isZipCode = /[1-9]{1}(\d+){5}/

//经纬度
//经度正则
let isTrue=/^(\-|\+)?(((\d|[1-9]\d|1[0-7]\d|0{1,3})\.\d{0,6})|(\d|[1-9]\d|1[0-7]\d|0{1,3})|180\.0{0,6}|180)$/;
//纬度正则
let isTrue=/^(\-|\+)?([0-8]?\d{1}\.\d{0,6}|90\.0{0,6}|[0-8]?\d{1}|90)$/;

/**
 * 诊断测试系统
 *
 * 功能：
 * - 题库管理
 * - 自适应出题
 * - 评分系统
 * - 诊断报告生成
 */

import { DIAGNOSIS_CONFIG, EXAM_SUBJECTS, getSubjectDisplayName } from '../config';
import { mathQuestions } from './math-questions';

// 题库数据 - 实际应用中应该从API或本地数据库加载
// 八年级下册中考诊断题库（55题，覆盖5科）
const QUESTION_BANK = {
  math: {
    grade8_down: [
      { id:'m01',subject:'math',chapter:'二次根式',section:'二次根式',knowledgePoint:'根式化简',type:'choice',difficulty:'easy',question:'√18化简后等于（）',options:['A.2√3','B.3√2','C.2√6','D.9√2'],answer:'B',explanation:'√18=√(9×2)=3√2',score:2 },
      { id:'m02',subject:'math',chapter:'二次根式',section:'二次根式',knowledgePoint:'根式运算',type:'choice',difficulty:'medium',question:'√2×√8的结果是（）',options:['A.√10','B.4','C.√16','D.2√2'],answer:'B',explanation:'√2×√8=√16=4',score:2 },
      { id:'m03',subject:'math',chapter:'二次根式',section:'二次根式',knowledgePoint:'分母有理化',type:'choice',difficulty:'medium',question:'1/√2分母有理化后等于（）',options:['A.√2','B.2/√2','C.√2/2','D.2√2'],answer:'C',explanation:'1/√2=√2/2',score:2 },
      { id:'m04',subject:'math',chapter:'勾股定理',section:'勾股定理',knowledgePoint:'勾股定理应用',type:'choice',difficulty:'easy',question:'直角三角形两直角边为3和4，斜边长为（）',options:['A.5','B.6','C.7','D.√7'],answer:'A',explanation:'3²+4²=25=5²，斜边=5',score:2 },
      { id:'m05',subject:'math',chapter:'勾股定理',section:'勾股定理',knowledgePoint:'勾股数',type:'choice',difficulty:'medium',question:'下列哪组数是勾股数（）',options:['A.1,2,3','B.5,12,13','C.6,7,8','D.2,4,5'],answer:'B',explanation:'5²+12²=25+144=169=13²',score:2 },
      { id:'m06',subject:'math',chapter:'勾股定理',section:'勾股定理逆定理',knowledgePoint:'直角三角形判定',type:'choice',difficulty:'medium',question:'三角形三边为6、8、10，此三角形是（）',options:['A.锐角三角形','B.直角三角形','C.钝角三角形','D.无法判断'],answer:'B',explanation:'6²+8²=100=10²，满足勾股定理逆定理',score:2 },
      { id:'m07',subject:'math',chapter:'平行四边形',section:'平行四边形性质',knowledgePoint:'对边性质',type:'choice',difficulty:'easy',question:'平行四边形对边的关系是（）',options:['A.互相垂直','B.平行且相等','C.平行不相等','D.相等不平行'],answer:'B',explanation:'平行四边形对边平行且相等',score:2 },
      { id:'m08',subject:'math',chapter:'平行四边形',section:'平行四边形判定',knowledgePoint:'判定定理',type:'choice',difficulty:'medium',question:'能判定四边形为平行四边形的是（）',options:['A.一组对边平行','B.对角线相等','C.两组对边分别相等','D.四个角都相等'],answer:'C',explanation:'两组对边分别相等是平行四边形的判定定理',score:2 },
      { id:'m09',subject:'math',chapter:'平行四边形',section:'矩形',knowledgePoint:'矩形性质',type:'choice',difficulty:'medium',question:'矩形对角线（）',options:['A.互相垂直','B.相等且互相平分','C.互相垂直且平分','D.以上都不对'],answer:'B',explanation:'矩形对角线相等且互相平分',score:2 },
      { id:'m10',subject:'math',chapter:'平行四边形',section:'菱形',knowledgePoint:'菱形性质',type:'choice',difficulty:'medium',question:'菱形对角线（）',options:['A.相等','B.互相垂直平分','C.互相平行','D.A和B都对'],answer:'B',explanation:'菱形对角线互相垂直平分，但不一定相等',score:2 },
      { id:'m11',subject:'math',chapter:'一次函数',section:'一次函数概念',knowledgePoint:'函数定义',type:'choice',difficulty:'easy',question:'下列哪个是一次函数（）',options:['A.y=x²','B.y=2x+1','C.y=1/x','D.y=x³'],answer:'B',explanation:'y=2x+1是y=kx+b形式的一次函数',score:2 },
      { id:'m12',subject:'math',chapter:'一次函数',section:'一次函数图像',knowledgePoint:'图像性质',type:'choice',difficulty:'medium',question:'y=-2x+3的图像经过（）',options:['A.第一、二、三象限','B.第一、二、四象限','C.第二、三、四象限','D.第一、三、四象限'],answer:'B',explanation:'k=-2<0下降，b=3>0交y轴正半轴，过一、二、四象限',score:2 },
      { id:'m13',subject:'math',chapter:'一次函数',section:'一次函数应用',knowledgePoint:'函数解析式',type:'choice',difficulty:'hard',question:'直线过点(1,3)和(2,5)，其解析式为（）',options:['A.y=x+2','B.y=2x+1','C.y=3x','D.y=-x+4'],answer:'B',explanation:'斜率k=(5-3)/(2-1)=2，代入(1,3): 3=2×1+b，b=1，即y=2x+1',score:3 },
      { id:'m14',subject:'math',chapter:'数据分析',section:'统计量',knowledgePoint:'平均数',type:'choice',difficulty:'easy',question:'数据2,3,5,7,8的平均数是（）',options:['A.4','B.5','C.6','D.7'],answer:'B',explanation:'(2+3+5+7+8)/5=25/5=5',score:2 },
      { id:'m15',subject:'math',chapter:'数据分析',section:'统计量',knowledgePoint:'方差',type:'choice',difficulty:'hard',question:'数据1,2,3,4,5的方差是（）',options:['A.1','B.1.5','C.2','D.2.5'],answer:'C',explanation:'平均数=3，方差=[(1-3)²+(2-3)²+(3-3)²+(4-3)²+(5-3)²]/5=10/5=2',score:3 },
    ],
    // 七年级～九年级全套数学题（250题），从 math-questions.js 导入
    grade_full: mathQuestions,
  },
  physics: {
    grade8_up: [
      { id:'p101',subject:'physics',chapter:'机械运动',section:'长度和时间的测量',knowledgePoint:'长度单位换算',type:'choice',difficulty:'easy',question:'在国际单位制中，长度的基本单位是（）',options:['A.千米','B.分米','C.米','D.厘米'],answer:'C',explanation:'国际单位制中长度的基本单位是米(m)',score:2 },
      { id:'p102',subject:'physics',chapter:'机械运动',section:'运动的描述',knowledgePoint:'参照物的选择',type:'choice',difficulty:'easy',question:'小明坐在行驶的公交车上，看到路边的树向后运动，他选择的参照物是（）',options:['A.地面','B.路边的树','C.公交车','D.路边的房屋'],answer:'C',explanation:'以公交车为参照物，树的相对位置在向后变化',score:2 },
      { id:'p103',subject:'physics',chapter:'机械运动',section:'运动的快慢',knowledgePoint:'速度单位换算',type:'choice',difficulty:'medium',question:'汽车速度72km/h，换算成m/s是（）',options:['A.10m/s','B.15m/s','C.20m/s','D.25m/s'],answer:'C',explanation:'72km/h=72×1000m/3600s=20m/s',score:2 },
      { id:'p104',subject:'physics',chapter:'机械运动',section:'运动的快慢',knowledgePoint:'匀速直线运动特点',type:'choice',difficulty:'easy',question:'关于匀速直线运动速度公式v=s/t，下列说法正确的是（）',options:['A.v与s成正比','B.v与t成反比','C.v不变，s与t成正比','D.以上都不对'],answer:'C',explanation:'匀速直线运动中速度不变，路程与时间成正比',score:2 },
      { id:'p105',subject:'physics',chapter:'机械运动',section:'测量平均速度',knowledgePoint:'平均速度计算',type:'choice',difficulty:'medium',question:'小明跑100m用时12.5s，他的平均速度约为（）',options:['A.6m/s','B.8m/s','C.10m/s','D.12m/s'],answer:'B',explanation:'v=s/t=100/12.5=8m/s',score:2 },
      { id:'p106',subject:'physics',chapter:'机械运动',section:'运动的快慢',knowledgePoint:'s-t图像分析',type:'choice',difficulty:'medium',question:'在s-t图像中，倾斜直线表示物体做（）',options:['A.静止','B.匀速直线运动','C.加速运动','D.减速运动'],answer:'B',explanation:'s-t图像中倾斜直线表示路程与时间成正比，即匀速直线运动',score:3 },
      { id:'p107',subject:'physics',chapter:'机械运动',section:'运动的快慢',knowledgePoint:'相对运动综合',type:'choice',difficulty:'hard',question:'甲速度是乙的2倍，乙通过路程是甲的1/4，则甲运动时间是乙的（）',options:['A.1/2','B.2倍','C.1/4','D.4倍'],answer:'B',explanation:'v甲=2v乙，s乙=s甲/4，t甲/t乙=(s甲/v甲)/(s乙/v乙)=(s甲/2v乙)/(s甲/4v乙)=2',score:3 },
      { id:'p108',subject:'physics',chapter:'声现象',section:'声音的产生与传播',knowledgePoint:'声音的产生',type:'choice',difficulty:'easy',question:'声音是由物体的（）产生的',options:['A.运动','B.振动','C.碰撞','D.摩擦'],answer:'B',explanation:'声音是由物体振动产生的，振动停止发声也停止',score:2 },
      { id:'p109',subject:'physics',chapter:'声现象',section:'声音的产生与传播',knowledgePoint:'声音的传播',type:'choice',difficulty:'easy',question:'宇航员在月球上面对面说话也听不见，原因是（）',options:['A.月球上温度太低','B.月球上没有空气','C.声音在月球上传播太慢','D.月球引力太小'],answer:'B',explanation:'声音传播需要介质，月球表面是真空，不能传声',score:2 },
      { id:'p110',subject:'physics',chapter:'声现象',section:'声音的产生与传播',knowledgePoint:'声速比较',type:'choice',difficulty:'easy',question:'一般情况下，声音在下列介质中传播最快的是（）',options:['A.空气','B.水','C.钢铁','D.真空'],answer:'C',explanation:'声速：固体>液体>气体，真空不能传声',score:2 },
      { id:'p111',subject:'physics',chapter:'声现象',section:'声音的特性',knowledgePoint:'音调与频率',type:'choice',difficulty:'easy',question:'女高音和男低音的主要区别是（）',options:['A.响度不同','B.音调不同','C.音色不同','D.振幅不同'],answer:'B',explanation:'女高音频率高音调高，男低音频率低音调低',score:2 },
      { id:'p112',subject:'physics',chapter:'声现象',section:'声音的产生与传播',knowledgePoint:'回声测距',type:'choice',difficulty:'medium',question:'某人对着山崖喊话，2秒后听到回声，声音在空气中速度为340m/s，人到山崖距离约为（）',options:['A.170m','B.340m','C.510m','D.680m'],answer:'B',explanation:'s=vt/2=340×2/2=340m（声音往返路程的一半）',score:2 },
      { id:'p113',subject:'physics',chapter:'声现象',section:'声音的特性',knowledgePoint:'声音三要素综合',type:'choice',difficulty:'medium',question:'波形图中，波形越密表示（）越高',options:['A.响度','B.音调','C.音色','D.声速'],answer:'B',explanation:'波形越密→频率越高→音调越高；振幅越大→响度越大',score:3 },
      { id:'p114',subject:'physics',chapter:'声现象',section:'噪声的危害和控制',knowledgePoint:'噪声防治途径',type:'choice',difficulty:'easy',question:'下列措施中属于在声源处减弱噪声的是（）',options:['A.道路两旁植树','B.高架路两侧安装隔音板','C.摩托车安装消声器','D.戴防噪声耳罩'],answer:'C',explanation:'消声器在声源处减弱噪声；植树和隔音板是传播过程中减弱；耳罩是人耳处减弱',score:2 },
      { id:'p115',subject:'physics',chapter:'物态变化',section:'温度',knowledgePoint:'温度计原理',type:'choice',difficulty:'easy',question:'常用温度计是根据液体（）的性质制成的',options:['A.热胀冷缩','B.质量不变','C.密度变化','D.颜色变化'],answer:'A',explanation:'液体温度计利用测温液体热胀冷缩的原理',score:2 },
      { id:'p116',subject:'physics',chapter:'物态变化',section:'熔化和凝固',knowledgePoint:'晶体熔化特点',type:'choice',difficulty:'easy',question:'冰在熔化过程中（）',options:['A.吸收热量，温度升高','B.吸收热量，温度不变','C.放出热量，温度降低','D.放出热量，温度不变'],answer:'B',explanation:'冰是晶体，熔化时吸收热量但温度保持0℃不变',score:2 },
      { id:'p117',subject:'physics',chapter:'物态变化',section:'汽化和液化',knowledgePoint:'蒸发影响因素',type:'choice',difficulty:'easy',question:'下列措施中能加快蒸发的是（）',options:['A.将蔬菜用保鲜膜包好','B.把湿衣服展开晾在通风处','C.把装有酒精的瓶子盖紧','D.给播种后的农田盖地膜'],answer:'B',explanation:'增大表面积、提高温度、加快空气流动都能加快蒸发',score:2 },
      { id:'p118',subject:'physics',chapter:'物态变化',section:'汽化和液化',knowledgePoint:'液化的方法',type:'choice',difficulty:'easy',question:'使气体液化的两种方法是（）',options:['A.升温和加压','B.降温和加压','C.升温和减压','D.降温和减压'],answer:'B',explanation:'降低温度和压缩体积是气体液化的两种方法',score:2 },
      { id:'p119',subject:'physics',chapter:'物态变化',section:'升华和凝华',knowledgePoint:'升华凝华现象',type:'choice',difficulty:'easy',question:'下列现象中属于升华的是（）',options:['A.冬天玻璃窗上的冰花','B.衣柜里的樟脑丸变小','C.夏天湿衣服晾干','D.秋天早晨草叶上的露珠'],answer:'B',explanation:'樟脑丸由固态直接变成气态是升华；冰花是凝华；晾干是蒸发；露珠是液化',score:2 },
      { id:'p120',subject:'physics',chapter:'物态变化',section:'物态变化综合',knowledgePoint:'吸放热判断',type:'choice',difficulty:'hard',question:'下列物态变化中都吸收热量的一组是（）',options:['A.熔化、汽化、升华','B.熔化、液化、凝华','C.汽化、凝固、升华','D.凝固、液化、凝华'],answer:'A',explanation:'六种物态变化中，熔化、汽化、升华吸热；凝固、液化、凝华放热',score:3 },
      { id:'p121',subject:'physics',chapter:'物态变化',section:'熔化和凝固',knowledgePoint:'晶体熔化图像',type:'choice',difficulty:'medium',question:'晶体熔化图像中，水平段表示（）',options:['A.晶体正在吸热升温','B.晶体正在放热降温','C.晶体正在熔化，温度不变','D.晶体已经完全熔化'],answer:'C',explanation:'晶体熔化图像中水平段（温度不变）对应熔化过程，固液共存',score:3 },
      { id:'p122',subject:'physics',chapter:'光现象',section:'光的直线传播',knowledgePoint:'光的直线传播',type:'choice',difficulty:'easy',question:'下列现象中，能用光的直线传播解释的是（）',options:['A.水中倒影','B.小孔成像','C.海市蜃楼','D.雨后彩虹'],answer:'B',explanation:'小孔成像是光沿直线传播形成的；倒影是反射；海市蜃楼和彩虹是折射',score:2 },
      { id:'p123',subject:'physics',chapter:'光现象',section:'光的反射',knowledgePoint:'光的反射定律',type:'choice',difficulty:'easy',question:'光反射时，反射角等于（）',options:['A.折射角','B.入射角','C.0°','D.90°'],answer:'B',explanation:'光的反射定律：反射角等于入射角',score:2 },
      { id:'p124',subject:'physics',chapter:'光现象',section:'光的反射',knowledgePoint:'镜面反射与漫反射',type:'choice',difficulty:'easy',question:'我们能从不同方向看到不发光的物体，是因为光在物体表面发生了（）',options:['A.镜面反射','B.漫反射','C.折射','D.直线传播'],answer:'B',explanation:'漫反射使光向各个方向反射，因此能从不同方向看到物体',score:2 },
      { id:'p125',subject:'physics',chapter:'光现象',section:'平面镜成像',knowledgePoint:'平面镜成像特点',type:'choice',difficulty:'easy',question:'平面镜成像的特点是（）',options:['A.正立放大的虚像','B.倒立等大的实像','C.正立等大的虚像','D.倒立缩小的实像'],answer:'C',explanation:'平面镜成像是正立、等大、虚像，像与物关于镜面对称',score:2 },
      { id:'p126',subject:'physics',chapter:'光现象',section:'光的折射',knowledgePoint:'折射规律',type:'choice',difficulty:'easy',question:'光从空气斜射入水中时，折射角（）入射角',options:['A.大于','B.等于','C.小于','D.无法确定'],answer:'C',explanation:'光从空气斜射入水中，折射角小于入射角（光从疏介质到密介质）',score:2 },
      { id:'p127',subject:'physics',chapter:'光现象',section:'光的折射',knowledgePoint:'折射现象解释',type:'choice',difficulty:'medium',question:'看到池水变浅，是由于光发生了（）',options:['A.反射','B.折射','C.色散','D.直线传播'],answer:'B',explanation:'池底反射的光从水进入空气时发生折射，折射光线远离法线，人眼逆着光线看去感觉池水变浅',score:3 },
      { id:'p128',subject:'physics',chapter:'光现象',section:'光的色散',knowledgePoint:'色散和不可见光',type:'choice',difficulty:'medium',question:'英国物理学家牛顿用三棱镜将太阳光分解成七色光带，这个现象叫（）',options:['A.光的反射','B.光的折射','C.光的色散','D.光的干涉'],answer:'C',explanation:'太阳光（白光）通过三棱镜被分解为红橙黄绿蓝靛紫七色光的现象称为光的色散',score:3 },
      { id:'p129',subject:'physics',chapter:'透镜及其应用',section:'透镜',knowledgePoint:'凸透镜作用',type:'choice',difficulty:'easy',question:'凸透镜对光有（）作用',options:['A.发散','B.会聚','C.既不会聚也不发散','D.反射'],answer:'B',explanation:'凸透镜对光有会聚作用，凹透镜对光有发散作用',score:2 },
      { id:'p130',subject:'physics',chapter:'透镜及其应用',section:'凸透镜成像规律',knowledgePoint:'成像规律(u>2f)',type:'choice',difficulty:'medium',question:'物体在凸透镜二倍焦距以外时，成（）',options:['A.正立放大的虚像','B.倒立缩小的实像','C.倒立放大的实像','D.倒立等大的实像'],answer:'B',explanation:'u>2f时成倒立、缩小的实像，应用：照相机',score:2 },
      { id:'p131',subject:'physics',chapter:'透镜及其应用',section:'生活中的透镜',knowledgePoint:'投影仪原理',type:'choice',difficulty:'medium',question:'投影仪成像时，物体应放在（）',options:['A.f<u<2f','B.u>2f','C.u<f','D.u=2f'],answer:'A',explanation:'投影仪原理：f<u<2f时成倒立、放大的实像',score:2 },
      { id:'p132',subject:'physics',chapter:'透镜及其应用',section:'眼睛和眼镜',knowledgePoint:'近视眼矫正',type:'choice',difficulty:'medium',question:'近视眼应配戴（）矫正',options:['A.凸透镜','B.凹透镜','C.平面镜','D.三棱镜'],answer:'B',explanation:'近视眼成像在视网膜前，需用凹透镜发散光线使像后移至视网膜',score:3 },
      { id:'p133',subject:'physics',chapter:'透镜及其应用',section:'凸透镜成像规律',knowledgePoint:'实像与虚像',type:'choice',difficulty:'easy',question:'下列关于实像和虚像说法正确的是（）',options:['A.实像能用光屏承接','B.虚像都是放大的','C.实像都是倒立的','D.虚像不能用眼睛看到'],answer:'A',explanation:'实像由实际光线会聚而成，能用光屏承接；虚像不能',score:2 },
      { id:'p134',subject:'physics',chapter:'透镜及其应用',section:'凸透镜成像规律',knowledgePoint:'成像动态变化',type:'choice',difficulty:'hard',question:'物体从凸透镜焦点外向透镜移动时，像的变化是（）',options:['A.像逐渐变大靠近透镜','B.像逐渐变小靠近透镜','C.像逐渐变大远离透镜','D.像逐渐变小远离透镜'],answer:'C',explanation:'物近像远像变大：物体靠近透镜，像远离透镜且变大',score:3 },
      { id:'p135',subject:'physics',chapter:'质量与密度',section:'质量',knowledgePoint:'质量属性',type:'choice',difficulty:'easy',question:'一块铁块在下列情况下质量会发生变化的是（）',options:['A.把它加热到100℃','B.把它熔化成铁水','C.把它从地球带到月球','D.把它锉成零件'],answer:'D',explanation:'质量是物体本身属性，不随形状、状态、位置、温度变化而变化，但被锉掉一部分后质量减小',score:2 },
      { id:'p136',subject:'physics',chapter:'质量与密度',section:'密度',knowledgePoint:'密度公式计算',type:'choice',difficulty:'easy',question:'一块质量为270g的铝块，体积为100cm³，它的密度为（）',options:['A.2.7g/cm³','B.1.0g/cm³','C.27g/cm³','D.0.37g/cm³'],answer:'A',explanation:'ρ=m/V=270/100=2.7g/cm³',score:2 },
      { id:'p137',subject:'physics',chapter:'质量与密度',section:'测量物质的密度',knowledgePoint:'天平使用',type:'choice',difficulty:'easy',question:'使用托盘天平时，应将物体放在（）盘中',options:['A.左','B.右','C.任意','D.上'],answer:'A',explanation:'使用天平时"左物右码"——物体放左盘，砝码放右盘',score:2 },
      { id:'p138',subject:'physics',chapter:'质量与密度',section:'密度',knowledgePoint:'密度单位换算',type:'choice',difficulty:'easy',question:'水的密度1g/cm³，换算成kg/m³为（）',options:['A.10','B.100','C.1000','D.10000'],answer:'C',explanation:'1g/cm³=1000kg/m³',score:2 },
      { id:'p139',subject:'physics',chapter:'质量与密度',section:'密度与社会生活',knowledgePoint:'空心实心判断',type:'choice',difficulty:'medium',question:'一个质量为158g的铁球体积为30cm³(ρ铁=7.9g/cm³)，该铁球（）',options:['A.是实心的','B.是空心的，空心体积10cm³','C.是空心的，空心体积20cm³','D.无法判断'],answer:'B',explanation:'实心体积V=m/ρ=158/7.9=20cm³<30cm³，所以是空心的，空心体积=30-20=10cm³',score:3 },
      { id:'p140',subject:'physics',chapter:'质量与密度',section:'测量物质的密度',knowledgePoint:'测量液体密度',type:'choice',difficulty:'medium',question:'在测量盐水密度实验中，先测烧杯和盐水总质量m₁，倒入量筒部分后测剩余总质量m₂，量筒中盐水体积为V，则盐水密度表达式正确的是（）',options:['A.ρ=m₁/V','B.ρ=m₂/V','C.ρ=(m₁-m₂)/V','D.ρ=(m₁+m₂)/V'],answer:'C',explanation:'量筒中盐水质量m=m₁-m₂，密度ρ=m/V=(m₁-m₂)/V，此方法避免了烧杯壁残留导致的误差',score:3 }
    ],
    grade8_down: [
      { id:'p01',subject:'physics',chapter:'力',section:'力的概念',knowledgePoint:'力的作用效果',type:'choice',difficulty:'easy',question:'力的作用效果不包括（）',options:['A.改变物体形状','B.改变物体运动状态','C.改变物体质量','D.使物体发生形变'],answer:'C',explanation:'力不能改变物体的质量',score:2 },
      { id:'p02',subject:'physics',chapter:'力',section:'重力',knowledgePoint:'重力计算',type:'choice',difficulty:'easy',question:'质量为5kg的物体，受到的重力约为（）(g=10N/kg)',options:['A.5N','B.10N','C.50N','D.500N'],answer:'C',explanation:'G=mg=5×10=50N',score:2 },
      { id:'p14',subject:'physics',chapter:'力',section:'力的概念',knowledgePoint:'力的三要素',type:'choice',difficulty:'easy',question:'力的三要素是指（）',options:['A.大小、方向、作用点','B.大小、方向、单位','C.方向、作用点、单位','D.大小、作用点、单位'],answer:'A',explanation:'力的三要素：力的大小、方向和作用点',score:2 },
      { id:'p15',subject:'physics',chapter:'力',section:'弹力',knowledgePoint:'弹力概念',type:'choice',difficulty:'easy',question:'下列力中属于弹力的是（）',options:['A.重力','B.磁铁对小铁钉的力','C.桌面对书的支持力','D.电荷间的力'],answer:'C',explanation:'支持力是由于桌面发生弹性形变而产生的，属于弹力',score:2 },
      { id:'p16',subject:'physics',chapter:'力',section:'弹力',knowledgePoint:'弹簧测力计',type:'choice',difficulty:'medium',question:'使用弹簧测力计前，首先要（）',options:['A.测量物体的重力','B.来回拉几次','C.观察量程和分度值，并调零','D.估测力的大小'],answer:'C',explanation:'使用弹簧测力计前应先观察量程和分度值并调零',score:2 },
      { id:'p17',subject:'physics',chapter:'力',section:'重力',knowledgePoint:'重力的方向',type:'choice',difficulty:'easy',question:'重力的方向总是（）',options:['A.垂直向下','B.竖直向下','C.指向地心','D.与接触面垂直'],answer:'B',explanation:'重力的方向总是竖直向下（指向地心的近似说法）',score:2 },
      { id:'p18',subject:'physics',chapter:'力',section:'力的概念',knowledgePoint:'力的示意图',type:'choice',difficulty:'medium',question:'在力的示意图中，线段长度表示（）',options:['A.力的方向','B.力的大小','C.力的作用点','D.力的作用效果'],answer:'B',explanation:'力的示意图中线段长度（标度）表示力的大小，箭头表示方向',score:3 },
      { id:'p19',subject:'physics',chapter:'力',section:'力的概念',knowledgePoint:'力的相互性',type:'choice',difficulty:'easy',question:'用手拍桌子手会疼，说明（）',options:['A.力可以改变物体的形状','B.物体间力的作用是相互的','C.力可以改变运动状态','D.桌子比手硬'],answer:'B',explanation:'手对桌子施力时桌子也对手施加反作用力，说明力的作用是相互的',score:2 },
      { id:'p20',subject:'physics',chapter:'力',section:'重力',knowledgePoint:'重力与质量关系',type:'choice',difficulty:'medium',question:'关于重力与质量的关系，正确的说法是（）',options:['A.质量与重力成正比','B.重力与质量成正比','C.重力就是质量','D.重力与质量无关'],answer:'B',explanation:'G=mg，g为常数，所以重力与质量成正比，不能说质量与重力成正比',score:2 },
      { id:'p21',subject:'physics',chapter:'力',section:'力的概念',knowledgePoint:'合力计算',type:'choice',difficulty:'hard',question:'同一直线上两个力F₁=8N（向右）、F₂=3N（向左），合力大小和方向为（）',options:['A.11N向右','B.5N向右','C.5N向左','D.11N向左'],answer:'B',explanation:'同一直线上方向相反，合力F=8-3=5N，方向与较大的力相同（向右）',score:3 },
      { id:'p22',subject:'physics',chapter:'力',section:'弹力',knowledgePoint:'弹簧伸长量与拉力关系',type:'choice',difficulty:'medium',question:'在弹性限度内，弹簧的伸长量与受到的拉力成（）',options:['A.反比','B.正比','C.无关','D.平方关系'],answer:'B',explanation:'胡克定律：在弹性限度内，弹簧伸长量与拉力成正比',score:2 },
      { id:'p23',subject:'physics',chapter:'力',section:'力的概念',knowledgePoint:'力的单位',type:'choice',difficulty:'easy',question:'在国际单位制中，力的单位是（）',options:['A.千克(kg)','B.牛顿(N)','C.帕斯卡(Pa)','D.焦耳(J)'],answer:'B',explanation:'力的单位是牛顿，简称牛，符号N',score:2 },
      { id:'p24',subject:'physics',chapter:'力',section:'力的概念',knowledgePoint:'受力分析',type:'choice',difficulty:'hard',question:'静止在水平桌面上的书，受到的平衡力是（）',options:['A.书的重力和书对桌面的压力','B.书对桌面的压力和桌面对书的支持力','C.书的重力和桌面对书的支持力','D.没有平衡力'],answer:'C',explanation:'书受重力(竖直向下)和支持力(竖直向上)，二力平衡。A不是同一物体，B是相互作用力',score:3 },
      { id:'p25',subject:'physics',chapter:'力',section:'重力',knowledgePoint:'重心概念',type:'choice',difficulty:'easy',question:'关于物体的重心，下列说法正确的是（）',options:['A.重心一定在物体上','B.形状规则的物体重心在几何中心','C.重心是重力的作用点','D.重心位置与物体形状无关'],answer:'C',explanation:'重心是重力在物体上的等效作用点。重心不一定在物体上（如圆环）',score:2 },
      { id:'p26',subject:'physics',chapter:'力',section:'力的概念',knowledgePoint:'力的作用效果实例',type:'choice',difficulty:'easy',question:'下列现象中说明力可以改变物体运动状态的是（）',options:['A.用力拉弹簧，弹簧变长','B.足球被踢后飞出去','C.用力捏橡皮泥','D.竹子被压弯'],answer:'B',explanation:'足球从静止到飞出去，运动状态改变。其他选项是力改变物体形状',score:2 },
      { id:'p03',subject:'physics',chapter:'运动和力',section:'牛顿第一定律',knowledgePoint:'惯性',type:'choice',difficulty:'easy',question:'下列哪种情况利用了惯性（）',options:['A.汽车刹车后继续前行','B.苹果从树上落下','C.火箭升空','D.弹簧被压缩'],answer:'A',explanation:'刹车后汽车由于惯性仍保持原来运动状态',score:2 },
      { id:'p04',subject:'physics',chapter:'运动和力',section:'二力平衡',knowledgePoint:'平衡条件',type:'choice',difficulty:'medium',question:'两个力平衡的条件是（）',options:['A.大小相等','B.方向相反','C.作用在同一物体同一线','D.以上都是'],answer:'D',explanation:'二力平衡：等大、反向、共线、同体',score:2 },
      { id:'p05',subject:'physics',chapter:'运动和力',section:'摩擦力',knowledgePoint:'滑动摩擦力',type:'choice',difficulty:'medium',question:'影响滑动摩擦力大小的因素是（）',options:['A.压力和接触面积','B.压力和接触面粗糙程度','C.物体运动速度','D.接触面积和粗糙程度'],answer:'B',explanation:'滑动摩擦力大小取决于压力和接触面粗糙程度',score:2 },
      { id:'p27',subject:'physics',chapter:'运动和力',section:'牛顿第一定律',knowledgePoint:'牛顿第一定律理解',type:'choice',difficulty:'easy',question:'关于牛顿第一定律，下列说法正确的是（）',options:['A.物体不受力就一定静止','B.力是维持物体运动的原因','C.物体不受力时可能做匀速直线运动','D.力是产生运动的原因'],answer:'C',explanation:'物体不受力时可能静止也可能做匀速直线运动；力是改变运动状态的原因而非维持运动的原因',score:2 },
      { id:'p28',subject:'physics',chapter:'运动和力',section:'牛顿第一定律',knowledgePoint:'惯性大小',type:'choice',difficulty:'medium',question:'惯性的大小只与物体的（）有关',options:['A.速度','B.质量','C.形状','D.位置'],answer:'B',explanation:'惯性是物体本身属性，大小只与质量有关，质量越大惯性越大',score:3 },
      { id:'p29',subject:'physics',chapter:'运动和力',section:'二力平衡',knowledgePoint:'二力平衡应用',type:'choice',difficulty:'easy',question:'一个物体受到10N的一对平衡力作用做匀速直线运动，如果这对平衡力同时增大到15N，物体将（）',options:['A.速度增大','B.做变速运动','C.仍做匀速直线运动，速度不变','D.静止'],answer:'C',explanation:'两个力仍平衡（等大反向），合力为零，物体运动状态不变',score:2 },
      { id:'p30',subject:'physics',chapter:'运动和力',section:'二力平衡',knowledgePoint:'平衡力与相互作用力',type:'choice',difficulty:'easy',question:'放在桌面上的茶杯，茶杯对桌面的压力和桌面对茶杯的支持力是（）',options:['A.平衡力','B.相互作用力','C.同一直线上的力','D.重力'],answer:'B',explanation:'这两个力作用在不同物体上，等大、反向、共线，是相互作用力，不是平衡力',score:2 },
      { id:'p31',subject:'physics',chapter:'运动和力',section:'摩擦力',knowledgePoint:'增大减小摩擦',type:'choice',difficulty:'easy',question:'下列措施中属于增大有益摩擦的是（）',options:['A.自行车轴承加润滑油','B.鞋底刻有花纹','C.气垫船船体脱离水面','D.行李箱下装轮子'],answer:'B',explanation:'鞋底花纹增大接触面粗糙程度来增大摩擦；A和C是减小摩擦，D是变滑动为滚动减小摩擦',score:2 },
      { id:'p32',subject:'physics',chapter:'运动和力',section:'摩擦力',knowledgePoint:'摩擦力方向',type:'choice',difficulty:'hard',question:'人走路时，鞋底受到的摩擦力方向是（）',options:['A.向前','B.向后','C.向上','D.向下'],answer:'A',explanation:'人走路时脚向后蹬地，地面给人向前的摩擦力，方向与运动方向相同（静摩擦力向前）',score:3 },
      { id:'p33',subject:'physics',chapter:'运动和力',section:'牛顿第一定律',knowledgePoint:'探究阻力对运动影响',type:'choice',difficulty:'medium',question:'在"探究阻力对物体运动的影响"实验中，小车从同一斜面同一高度下滑，目的是（）',options:['A.让小车获得相同的初速度','B.让小车运动时间相同','C.让小车受到阻力相同','D.让小车质量相同'],answer:'A',explanation:'同一高度下滑使小车到达水平面时初速度相同，控制变量研究阻力对运动的影响',score:2 },
      { id:'p34',subject:'physics',chapter:'运动和力',section:'力和运动的关系',knowledgePoint:'合力与运动状态',type:'choice',difficulty:'medium',question:'物体受到非平衡力作用时（）',options:['A.一定做匀速直线运动','B.一定保持静止','C.运动状态一定改变','D.速度一定不变'],answer:'C',explanation:'非平衡力即合力不为零，物体的运动状态一定会发生改变',score:3 },
      { id:'p35',subject:'physics',chapter:'运动和力',section:'摩擦力',knowledgePoint:'静摩擦力',type:'choice',difficulty:'easy',question:'用30N的水平力推一个重100N的箱子但没推动，箱子受到的摩擦力为（）',options:['A.0N','B.30N','C.100N','D.70N'],answer:'B',explanation:'箱子静止，水平方向受力平衡，静摩擦力=推力=30N',score:2 },
      { id:'p36',subject:'physics',chapter:'运动和力',section:'牛顿第一定律',knowledgePoint:'惯性现象',type:'choice',difficulty:'easy',question:'下列现象中不属于惯性现象的是（）',options:['A.跑步的人被石头绊倒向前摔','B.锤头松了将锤柄在地上撞几下','C.成熟的苹果从树上落下','D.汽车紧急刹车时乘客向前倾'],answer:'C',explanation:'苹果落地是重力作用的结果，不是惯性现象',score:2 },
      { id:'p37',subject:'physics',chapter:'运动和力',section:'二力平衡',knowledgePoint:'探究二力平衡条件',type:'choice',difficulty:'medium',question:'在"探究二力平衡条件"实验中，将小车扭转一个角度后释放，目的是验证（）',options:['A.两个力是否大小相等','B.两个力是否方向相反','C.两个力是否作用在同一直线上','D.两个力是否作用在同一物体上'],answer:'C',explanation:'扭转后两个力不在同一直线上，观察小车是否平衡来验证共线条件',score:2 },
      { id:'p38',subject:'physics',chapter:'运动和力',section:'摩擦力',knowledgePoint:'摩擦力综合分析',type:'choice',difficulty:'hard',question:'水平传送带上的物体随传送带一起匀速运动时，物体（）',options:['A.受向前的摩擦力','B.受向后的摩擦力','C.不受摩擦力','D.受向上的摩擦力'],answer:'C',explanation:'匀速运动时物体与传送带相对静止且无相对运动趋势，不受摩擦力',score:3 },
      { id:'p06',subject:'physics',chapter:'压强',section:'压强概念',knowledgePoint:'压强计算',type:'choice',difficulty:'medium',question:'一个重500N的人站立时双脚面积0.05m²，对地面压强为（）',options:['A.1000Pa','B.5000Pa','C.10000Pa','D.25000Pa'],answer:'C',explanation:'p=F/S=500/0.05=10000Pa',score:2 },
      { id:'p07',subject:'physics',chapter:'压强',section:'液体压强',knowledgePoint:'液体压强公式',type:'choice',difficulty:'medium',question:'液体压强公式p=ρgh中，h表示（）',options:['A.容器高度','B.液面到某点的深度','C.液体的体积','D.容器底面积'],answer:'B',explanation:'h是从液面到所求点的竖直深度',score:2 },
      { id:'p39',subject:'physics',chapter:'压强',section:'压强概念',knowledgePoint:'增大减小压强',type:'choice',difficulty:'easy',question:'下列做法中属于减小压强的是（）',options:['A.菜刀的刀刃很薄','B.书包带做得较宽','C.针尖做得很尖','D.图钉的钉尖做得很尖'],answer:'B',explanation:'宽书包带增大受力面积，减小压强；其他均减小受力面积增大压强',score:2 },
      { id:'p40',subject:'physics',chapter:'压强',section:'压强概念',knowledgePoint:'压强单位',type:'choice',difficulty:'easy',question:'压强的国际单位是（）',options:['A.牛顿(N)','B.焦耳(J)','C.帕斯卡(Pa)','D.瓦特(W)'],answer:'C',explanation:'压强单位是帕斯卡，1Pa=1N/m²',score:2 },
      { id:'p41',subject:'physics',chapter:'压强',section:'液体压强',knowledgePoint:'液体压强与深度',type:'choice',difficulty:'easy',question:'潜水员从水面下潜到10m深时，受到水的压强（）',options:['A.不变','B.减小','C.增大','D.无法判断'],answer:'C',explanation:'p=ρgh，深度h增大，液体压强增大',score:2 },
      { id:'p42',subject:'physics',chapter:'压强',section:'液体压强',knowledgePoint:'连通器原理',type:'choice',difficulty:'medium',question:'下列设备中不属于连通器的是（）',options:['A.茶壶','B.船闸','C.锅炉水位计','D.抽水机'],answer:'D',explanation:'抽水机利用大气压工作，不是连通器；茶壶、船闸、水位计都是连通器',score:3 },
      { id:'p43',subject:'physics',chapter:'压强',section:'大气压强',knowledgePoint:'大气压存在证明',type:'choice',difficulty:'easy',question:'首先证明大气压强存在的著名实验是（）',options:['A.托里拆利实验','B.马德堡半球实验','C.阿基米德实验','D.伽利略斜面实验'],answer:'B',explanation:'马德堡半球实验有力地证明了大气压强的存在；托里拆利实验是首次测出大气压值',score:2 },
      { id:'p44',subject:'physics',chapter:'压强',section:'大气压强',knowledgePoint:'托里拆利实验',type:'choice',difficulty:'easy',question:'托里拆利实验中，玻璃管倾斜时，管内水银柱的竖直高度（）',options:['A.变大','B.变小','C.不变','D.无法判断'],answer:'C',explanation:'托里拆利实验中水银柱的竖直高度由大气压决定，与玻璃管倾斜角度无关',score:2 },
      { id:'p45',subject:'physics',chapter:'压强',section:'液体压强',knowledgePoint:'液体压强综合',type:'choice',difficulty:'hard',question:'三个底面积相同但形状不同的容器装有相同深度的水，容器底受到水的压强关系是（）',options:['A.底大口小的最大','B.底小口大的最大','C.一样大','D.无法比较'],answer:'C',explanation:'p=ρgh只与液体密度和深度有关，与容器形状无关。深度相同则压强相等',score:3 },
      { id:'p46',subject:'physics',chapter:'压强',section:'流体压强与流速',knowledgePoint:'伯努利原理',type:'choice',difficulty:'easy',question:'飞机机翼做成上凸下平的形状，是利用了（）',options:['A.流速大的地方压强大','B.流速小的地方压强小','C.流速大的地方压强小','D.流速与压强无关'],answer:'C',explanation:'机翼上方空气流速大压强小，下方流速小压强大，产生向上的升力',score:2 },
      { id:'p47',subject:'physics',chapter:'压强',section:'压强综合',knowledgePoint:'固体压强切割',type:'choice',difficulty:'hard',question:'将均匀长方体沿竖直方向切去一半，剩余部分对桌面的压强（）',options:['A.变为原来一半','B.变为原来2倍','C.不变','D.无法判断'],answer:'C',explanation:'竖直切，压力和受力面积同时减半，p=F/S不变；若是水平切，则压强减半',score:3 },
      { id:'p48',subject:'physics',chapter:'压强',section:'压强概念',knowledgePoint:'探究压力作用效果',type:'choice',difficulty:'medium',question:'在"探究压力的作用效果"实验中，通过观察海绵的凹陷程度来反映压强大小，这种方法叫（）',options:['A.控制变量法','B.转换法','C.类比法','D.等效替代法'],answer:'B',explanation:'将不易观察的压强大小转换为易观察的海绵凹陷程度，是转换法',score:2 },
      { id:'p49',subject:'physics',chapter:'压强',section:'液体压强',knowledgePoint:'探究液体内部压强',type:'choice',difficulty:'easy',question:'用压强计探究液体内部压强时，U形管液面高度差越大说明（）',options:['A.液体密度越小','B.探头深度越小','C.探头处压强越大','D.液体温度越高'],answer:'C',explanation:'U形管液面高度差反映了探头处压强大小，高度差越大表明压强越大',score:2 },
      { id:'p50',subject:'physics',chapter:'压强',section:'大气压强',knowledgePoint:'大气压与海拔',type:'choice',difficulty:'easy',question:'海拔越高，大气压强（）',options:['A.越大','B.越小','C.不变','D.先大后小'],answer:'B',explanation:'大气压强随海拔高度的增加而减小（空气越来越稀薄）',score:2 },
      { id:'p51',subject:'physics',chapter:'压强',section:'压强综合',knowledgePoint:'固液压强混合',type:'choice',difficulty:'hard',question:'一个装满水的密闭容器放在水平桌面上，若将容器倒置，水对容器底的压强（）',options:['A.变大','B.变小','C.不变','D.无法判断'],answer:'C',explanation:'装满水的密闭容器倒置后，水的深度不变（始终充满），压强p=ρgh不变',score:3 },
      { id:'p08',subject:'physics',chapter:'浮力',section:'阿基米德原理',knowledgePoint:'浮力计算',type:'choice',difficulty:'medium',question:'体积为0.001m³的物体完全浸没在水中，受到的浮力为（）(ρ水=1000kg/m³,g=10N/kg)',options:['A.1N','B.10N','C.100N','D.0.1N'],answer:'B',explanation:'F浮=ρ液gV排=1000×10×0.001=10N',score:3 },
      { id:'p09',subject:'physics',chapter:'浮力',section:'物体浮沉条件',knowledgePoint:'浮沉判断',type:'choice',difficulty:'medium',question:'物体密度小于液体密度时，物体将（）',options:['A.下沉','B.漂浮','C.悬浮','D.无法判断'],answer:'B',explanation:'物体密度<液体密度→漂浮',score:2 },
      { id:'p52',subject:'physics',chapter:'浮力',section:'浮力概念',knowledgePoint:'浮力产生原因',type:'choice',difficulty:'easy',question:'浮力产生的原因是（）',options:['A.液体对物体的重力','B.物体上下表面的压力差','C.液体的密度','D.物体的体积'],answer:'B',explanation:'浮力是由液体对物体向上和向下的压力差产生的，F浮=F向上-F向下',score:2 },
      { id:'p53',subject:'physics',chapter:'浮力',section:'浮力概念',knowledgePoint:'浮力方向',type:'choice',difficulty:'easy',question:'浮力的方向总是（）',options:['A.竖直向上','B.竖直向下','C.与物体运动方向相反','D.水平方向'],answer:'A',explanation:'浮力方向总是竖直向上',score:2 },
      { id:'p54',subject:'physics',chapter:'浮力',section:'阿基米德原理',knowledgePoint:'阿基米德原理理解',type:'choice',difficulty:'easy',question:'关于阿基米德原理，下列说法正确的是（）',options:['A.浮力与物体浸没深度有关','B.浮力与物体形状有关','C.浮力等于物体排开液体的重力','D.浮力与液体多少有关'],answer:'C',explanation:'F浮=G排=ρ液gV排，只与液体密度和排开液体体积有关',score:2 },
      { id:'p55',subject:'physics',chapter:'浮力',section:'物体浮沉条件',knowledgePoint:'浮沉综合判断',type:'choice',difficulty:'hard',question:'同一物体分别放入水和盐水中，在水中沉底，在盐水中漂浮，则（）',options:['A.水中浮力大于盐水中浮力','B.盐水中浮力大于水中浮力','C.两次浮力相等','D.无法比较'],answer:'B',explanation:'漂浮时浮力=重力；沉底时浮力<重力。所以盐水（漂浮）中浮力=G>在水中（沉底）的浮力',score:3 },
      { id:'p56',subject:'physics',chapter:'浮力',section:'物体浮沉条件',knowledgePoint:'密度计原理',type:'choice',difficulty:'easy',question:'密度计在不同液体中都漂浮，它排开液体体积越大的液体密度越（）',options:['A.大','B.小','C.相等','D.无法判断'],answer:'B',explanation:'漂浮时F浮=G不变，由F浮=ρ液gV排可知ρ液与V排成反比，V排大则ρ液小',score:2 },
      { id:'p57',subject:'physics',chapter:'浮力',section:'浮力综合',knowledgePoint:'浮力图像',type:'choice',difficulty:'medium',question:'物体从刚接触水面到完全浸没的过程中，浮力随深度变化的图像是（）',options:['A.一直增大','B.先增大后不变','C.一直不变','D.先不变后增大'],answer:'B',explanation:'从开始进入到完全浸没，V排逐渐增大→浮力增大；完全浸没后V排不变→浮力不变',score:3 },
      { id:'p58',subject:'physics',chapter:'浮力',section:'浮力概念',knowledgePoint:'探究浮力影响因素',type:'choice',difficulty:'easy',question:'在"探究浮力大小与哪些因素有关"实验中，要探究浮力与液体密度的关系，需要控制的变量是（）',options:['A.物体浸入体积','B.物体材料','C.液体温度','D.以上都不是'],answer:'A',explanation:'控制变量法：探究浮力与ρ液关系时需保持V排相同',score:2 },
      { id:'p59',subject:'physics',chapter:'浮力',section:'物体浮沉条件',knowledgePoint:'潜水艇原理',type:'choice',difficulty:'medium',question:'潜水艇实现上浮和下潜是通过改变（）',options:['A.自身重力','B.自身体积','C.海水密度','D.下潜深度'],answer:'A',explanation:'潜水艇通过水舱进排水改变自身重力来实现浮沉，体积基本不变',score:2 },
      { id:'p60',subject:'physics',chapter:'浮力',section:'浮力综合',knowledgePoint:'浮力压强综合',type:'choice',difficulty:'hard',question:'一块冰漂浮在水面上，冰完全熔化后，水面高度将（）',options:['A.升高','B.降低','C.不变','D.无法判断'],answer:'C',explanation:'冰排开水的体积等于冰熔化后水的体积，故水面不变',score:3 },
      { id:'p61',subject:'physics',chapter:'浮力',section:'物体浮沉条件',knowledgePoint:'漂浮条件',type:'choice',difficulty:'easy',question:'物体漂浮在液面上时，浮力与重力的关系是（）',options:['A.F浮>G','B.F浮<G','C.F浮=G','D.无法确定'],answer:'C',explanation:'物体漂浮（静止）时处于平衡状态，F浮=G',score:2 },
      { id:'p62',subject:'physics',chapter:'浮力',section:'浮力的应用',knowledgePoint:'气球和飞艇',type:'choice',difficulty:'easy',question:'热气球升空是因为内部空气受热后（）',options:['A.密度减小，浮力大于重力','B.密度增大，重力变小','C.体积增大，重力变小','D.质量变小，浮力增大'],answer:'A',explanation:'热空气密度比冷空气小，气球内热空气密度小于外部空气密度，浮力大于重力',score:2 },
      { id:'p63',subject:'physics',chapter:'浮力',section:'浮力综合',knowledgePoint:'浮力压强组合',type:'choice',difficulty:'hard',question:'将一物体浸没在水中后放手，物体上浮。在露出水面前，物体受到的浮力和水对容器底压强的变化是（）',options:['A.浮力不变，压强不变','B.浮力减小，压强减小','C.浮力不变，压强减小','D.浮力减小，压强不变'],answer:'A',explanation:'露出水面前V排不变→浮力不变，水面高度不变→压强不变',score:3 },
      { id:'p64',subject:'physics',chapter:'浮力',section:'阿基米德原理',knowledgePoint:'验证阿基米德原理',type:'choice',difficulty:'easy',question:'验证阿基米德原理实验中，需要用弹簧测力计测量（）',options:['A.物体在空气中和液体中的拉力','B.物体的体积','C.液体的密度','D.物体下潜的深度'],answer:'A',explanation:'通过称重法F浮=G-F示求出浮力，再与排开液体重力G排比较',score:2 },
      { id:'p10',subject:'physics',chapter:'功和机械能',section:'功',knowledgePoint:'功的计算',type:'choice',difficulty:'medium',question:'用50N的力推物体前进4m，做的功为（）',options:['A.12.5J','B.54J','C.200J','D.400J'],answer:'C',explanation:'W=Fs=50×4=200J',score:2 },
      { id:'p11',subject:'physics',chapter:'功和机械能',section:'功率',knowledgePoint:'功率计算',type:'choice',difficulty:'medium',question:'某机器10秒做功2000J，功率为（）',options:['A.20W','B.200W','C.2000W','D.20000W'],answer:'B',explanation:'P=W/t=2000/10=200W',score:2 },
      { id:'p65',subject:'physics',chapter:'功和机械能',section:'功',knowledgePoint:'做功必要条件',type:'choice',difficulty:'easy',question:'关于做功，下列说法正确的是（）',options:['A.有力作用在物体上这个力一定做功','B.物体移动了距离就一定有做功','C.物体受到力并沿力的方向移动距离才做功','D.做功与力的大小无关'],answer:'C',explanation:'做功两个必要条件：有力作用在物体上且物体在力的方向上通过距离',score:2 },
      { id:'p66',subject:'physics',chapter:'功和机械能',section:'功',knowledgePoint:'不做功的情况',type:'choice',difficulty:'easy',question:'下列情况中力没有对物体做功的是（）',options:['A.人提着水桶在水平路面匀速走','B.起重机吊起货物','C.人推车前进','D.马拉车前进'],answer:'A',explanation:'提水桶的力竖直向上，水平移动时在力的方向上没有距离，所以不做功',score:2 },
      { id:'p67',subject:'physics',chapter:'功和机械能',section:'功',knowledgePoint:'功的综合计算',type:'choice',difficulty:'hard',question:'用100N的力将重50N的物体沿斜面推上2m高的平台，斜面长5m，推力做的功为（）',options:['A.100J','B.200J','C.500J','D.250J'],answer:'C',explanation:'W=Fs=100N×5m=500J（推力做的功即总功；有用功=Gh=50×2=100J）',score:3 },
      { id:'p68',subject:'physics',chapter:'功和机械能',section:'功率',knowledgePoint:'功率概念',type:'choice',difficulty:'easy',question:'功率是表示（）的物理量',options:['A.做功多少','B.做功快慢','C.机械效率高低','D.能量大小'],answer:'B',explanation:'功率表示做功的快慢，即单位时间内做功的多少',score:2 },
      { id:'p69',subject:'physics',chapter:'功和机械能',section:'功率',knowledgePoint:'功率单位',type:'choice',difficulty:'easy',question:'功率的国际单位是（）',options:['A.焦耳(J)','B.瓦特(W)','C.牛顿(N)','D.帕斯卡(Pa)'],answer:'B',explanation:'功率国际单位是瓦特(W)，1W=1J/s',score:2 },
      { id:'p70',subject:'physics',chapter:'功和机械能',section:'动能和势能',knowledgePoint:'动能影响因素',type:'choice',difficulty:'easy',question:'下列哪种情况物体的动能最大（）',options:['A.质量大速度小的物体','B.质量小速度大的物体','C.质量和速度都大的物体','D.以上都不对'],answer:'C',explanation:'动能与质量和速度都有关：质量越大、速度越大，动能越大',score:2 },
      { id:'p71',subject:'physics',chapter:'功和机械能',section:'机械能及其转化',knowledgePoint:'动能势能转化',type:'choice',difficulty:'hard',question:'人造卫星从近地点向远地点运行时（）',options:['A.动能增大，势能减小','B.动能减小，势能增大','C.动能和势能都增大','D.动能和势能都减小'],answer:'B',explanation:'近→远：高度增大→势能增大，速度减小→动能减小，动能转化为势能',score:3 },
      { id:'p72',subject:'physics',chapter:'功和机械能',section:'动能和势能',knowledgePoint:'重力势能影响因素',type:'choice',difficulty:'easy',question:'重力势能的大小与（）有关',options:['A.质量和高度','B.质量和速度','C.高度和速度','D.质量和弹性形变'],answer:'A',explanation:'重力势能Ep=mgh，与物体质量和被举高的高度有关',score:2 },
      { id:'p73',subject:'physics',chapter:'功和机械能',section:'动能和势能',knowledgePoint:'弹性势能',type:'choice',difficulty:'easy',question:'下列物体具有弹性势能的是（）',options:['A.被举高的重锤','B.空中飞行的小鸟','C.被拉开的弓','D.水平面上的足球'],answer:'C',explanation:'被拉开的弓发生弹性形变，具有弹性势能。A是重力势能，B是动能和重力势能',score:2 },
      { id:'p74',subject:'physics',chapter:'功和机械能',section:'机械能及其转化',knowledgePoint:'机械能守恒',type:'choice',difficulty:'medium',question:'不考虑空气阻力，物体从高处自由下落过程中（）',options:['A.动能不变，势能减小','B.动能增大，势能减小，机械能不变','C.动能减小，势能增大','D.动能和势能都不变'],answer:'B',explanation:'下落过程重力势能转化为动能，不考虑阻力时机械能守恒',score:2 },
      { id:'p75',subject:'physics',chapter:'功和机械能',section:'机械能及其转化',knowledgePoint:'机械能转化图像',type:'choice',difficulty:'hard',question:'竖直上抛的物体（不计空气阻力），在上升过程中动能随时间变化的图像大致为（）',options:['A.一直水平','B.逐渐增大','C.逐渐减小','D.先减后增'],answer:'C',explanation:'上升过程速度逐渐减小（动能减少），到达最高点速度为零（动能为零）',score:3 },
      { id:'p76',subject:'physics',chapter:'功和机械能',section:'动能和势能',knowledgePoint:'探究动能影响因素',type:'choice',difficulty:'medium',question:'在"探究动能大小与哪些因素有关"实验中，通过观察木块被撞击后移动的距离来反映动能大小，这采用了（）',options:['A.控制变量法','B.转换法','C.类比法','D.模型法'],answer:'B',explanation:'将不易直接测量的动能转换为容易观察的木块移动距离，是转换法',score:2 },
      { id:'p77',subject:'physics',chapter:'功和机械能',section:'功率',knowledgePoint:'P=Fv公式',type:'choice',difficulty:'easy',question:'汽车上坡时司机通常换低档减速，这是为了（）',options:['A.增大功率','B.减小功率','C.增大牵引力','D.减小牵引力'],answer:'C',explanation:'由P=Fv，功率一定时减小速度可增大牵引力，便于爬坡',score:2 },
      { id:'p78',subject:'physics',chapter:'功和机械能',section:'机械效率',knowledgePoint:'斜面机械效率',type:'choice',difficulty:'hard',question:'将物体沿斜面拉上高处，斜面的机械效率与下列因素有关的是（）',options:['A.斜面的长度','B.斜面的粗糙程度','C.物体的质量','D.拉力的大小'],answer:'B',explanation:'斜面越粗糙，额外功（克服摩擦做功）越多，机械效率越低',score:3 },
      { id:'p79',subject:'physics',chapter:'功和机械能',section:'功',knowledgePoint:'能量单位',type:'choice',difficulty:'easy',question:'功和能的国际单位都是（）',options:['A.瓦特(W)','B.牛顿(N)','C.焦耳(J)','D.帕斯卡(Pa)'],answer:'C',explanation:'功和能的单位都是焦耳(焦，J)，1J=1N·m',score:2 },
      { id:'p80',subject:'physics',chapter:'功和机械能',section:'动能和势能',knowledgePoint:'探究重力势能影响因素',type:'choice',difficulty:'easy',question:'在探究重力势能与质量关系的实验中，应保持（）相同',options:['A.物体质量','B.下落高度','C.物体材料','D.物体形状'],answer:'B',explanation:'控制变量法：探究重力势能与质量关系时保持下落高度不变',score:2 },
      { id:'p81',subject:'physics',chapter:'功和机械能',section:'功和机械能综合',knowledgePoint:'功和能综合',type:'choice',difficulty:'hard',question:'体重相同的甲乙两人，甲匀速上楼，乙跑步上楼，则（）',options:['A.甲做功多','B.乙做功多','C.两人做功一样多，甲功率大','D.两人做功一样多，乙功率大'],answer:'D',explanation:'W=Gh，体重和高度相同则做功相同；乙用时短，P=W/t，乙功率大',score:3 },
      { id:'p82',subject:'physics',chapter:'功和机械能',section:'机械能及其转化',knowledgePoint:'机械能守恒条件',type:'choice',difficulty:'medium',question:'机械能守恒的条件是（）',options:['A.没有外力作用','B.只有重力或弹力做功','C.物体做匀速运动','D.物体受到平衡力'],answer:'B',explanation:'机械能守恒的条件是只有重力或弹力（弹簧）做功，即没有摩擦力等外力做功',score:2 },
      { id:'p12',subject:'physics',chapter:'简单机械',section:'杠杆',knowledgePoint:'杠杆平衡',type:'choice',difficulty:'medium',question:'杠杆平衡时，动力×动力臂（）阻力×阻力臂',options:['A.大于','B.小于','C.等于','D.无关'],answer:'C',explanation:'杠杆平衡条件：F₁L₁=F₂L₂',score:2 },
      { id:'p13',subject:'physics',chapter:'简单机械',section:'滑轮组',knowledgePoint:'机械效率',type:'choice',difficulty:'hard',question:'机械效率η的计算公式是（）',options:['A.W总/W有用','B.W有用/W总×100%','C.W总-W有用','D.W有用+W总'],answer:'B',explanation:'η=W有用/W总×100%，机械效率总小于1',score:3 },
      { id:'p83',subject:'physics',chapter:'简单机械',section:'杠杆',knowledgePoint:'杠杆五要素',type:'choice',difficulty:'medium',question:'关于力臂，下列说法正确的是（）',options:['A.力臂就是力的作用点到支点的距离','B.力臂是支点到力的作用线的垂直距离','C.力臂一定在杠杆上','D.力臂就是杠杆的长度'],answer:'B',explanation:'力臂是从支点到力的作用线的垂直距离，不一定在杠杆上',score:2 },
      { id:'p84',subject:'physics',chapter:'简单机械',section:'杠杆',knowledgePoint:'杠杆分类',type:'choice',difficulty:'easy',question:'下列工具中属于省力杠杆的是（）',options:['A.钓鱼竿','B.筷子','C.开瓶器','D.镊子'],answer:'C',explanation:'开瓶器动力臂大于阻力臂，是省力杠杆；其余都是费力杠杆（省距离）',score:2 },
      { id:'p85',subject:'physics',chapter:'简单机械',section:'杠杆',knowledgePoint:'力臂作图',type:'choice',difficulty:'medium',question:'画出力臂的正确方法是（）',options:['A.连接支点和力的作用点','B.过支点作力的作用线的垂线段','C.作力的作用线的平行线','D.连接支点和物体重心'],answer:'B',explanation:'力臂的作法：过支点向力的作用线作垂线，垂线段长度即为力臂',score:2 },
      { id:'p86',subject:'physics',chapter:'简单机械',section:'杠杆',knowledgePoint:'杠杆动态平衡',type:'choice',difficulty:'hard',question:'杠杆原来在水平位置平衡，若将两侧钩码同时向支点移动相同距离，则杠杆（）',options:['A.仍保持平衡','B.左侧下沉','C.右侧下沉','D.无法判断'],answer:'C',explanation:'原来F₁L₁=F₂L₂。若F₁>F₂则L₁<L₂，移动相同距离ΔL后，F₁(L₁-ΔL)变化更大。若F₁>F₂（左侧力大臂短），则左侧力矩减少更多→右侧下沉',score:3 },
      { id:'p87',subject:'physics',chapter:'简单机械',section:'滑轮',knowledgePoint:'定滑轮和动滑轮',type:'choice',difficulty:'medium',question:'关于定滑轮，下列说法正确的是（）',options:['A.可以省力','B.可以省距离','C.可以改变力的方向','D.可以省功'],answer:'C',explanation:'定滑轮实质是等臂杠杆，不省力不省距离，但可以改变力的方向',score:2 },
      { id:'p88',subject:'physics',chapter:'简单机械',section:'滑轮',knowledgePoint:'滑轮组计算',type:'choice',difficulty:'hard',question:'用一个滑轮组提升重物，承担物重的绳子段数n=3，不计摩擦和绳重，则拉力F为（）',options:['A.F=G','B.F=G/2','C.F=G/3','D.F=3G'],answer:'C',explanation:'不考虑动滑轮重时，F=G/n=G/3',score:3 },
      { id:'p89',subject:'physics',chapter:'简单机械',section:'其他简单机械',knowledgePoint:'轮轴和斜面',type:'choice',difficulty:'medium',question:'盘山公路利用的是（）原理',options:['A.杠杆','B.滑轮','C.斜面','D.轮轴'],answer:'C',explanation:'盘山公路是斜面的变形应用，通过增加长度来减小所需的力（省力但费距离）',score:2 },
      { id:'p90',subject:'physics',chapter:'简单机械',section:'杠杆',knowledgePoint:'等臂杠杆',type:'choice',difficulty:'easy',question:'下列属于等臂杠杆的是（）',options:['A.天平','B.剪刀','C.筷子','D.扳手'],answer:'A',explanation:'天平动力臂等于阻力臂，是等臂杠杆。剪刀一般是省力杠杆，筷子和镊子是费力杠杆',score:2 },
      { id:'p91',subject:'physics',chapter:'简单机械',section:'杠杆',knowledgePoint:'探究杠杆平衡条件',type:'choice',difficulty:'medium',question:'在"探究杠杆平衡条件"实验中，多次实验的目的是（）',options:['A.减小误差','B.寻找普遍规律','C.使数据准确','D.取平均值'],answer:'B',explanation:'探究规律的实验（如杠杆平衡条件）多次实验是为了寻找普遍规律，避免结论的偶然性',score:3 },
      { id:'p92',subject:'physics',chapter:'简单机械',section:'机械效率',knowledgePoint:'滑轮组机械效率',type:'choice',difficulty:'medium',question:'关于滑轮组的机械效率，下列说法正确的是（）',options:['A.机械效率可以等于100%','B.有用功越多机械效率越高','C.额外功越少机械效率越高','D.功率越大机械效率越高'],answer:'C',explanation:'η=W有用/W总=W有用/(W有用+W额外)，额外功越少则η越高。机械效率总小于1',score:2 },
      { id:'p93',subject:'physics',chapter:'简单机械',section:'机械效率',knowledgePoint:'机械效率比较',type:'choice',difficulty:'hard',question:'用同一滑轮组提升不同重物，下列说法正确的是（）',options:['A.提升物体越重，机械效率越高','B.提升物体越轻，机械效率越高','C.机械效率与物重无关','D.提升越快，机械效率越高'],answer:'A',explanation:'同一滑轮组，动滑轮重不变，物重越大，有用功占比越大，机械效率越高',score:3 },
      { id:'p94',subject:'physics',chapter:'简单机械',section:'机械效率',knowledgePoint:'测量滑轮组机械效率',type:'choice',difficulty:'medium',question:'测量滑轮组机械效率时需要测量的物理量不包括（）',options:['A.物体的重力','B.物体上升的高度','C.拉力的大小','D.绳子的材质'],answer:'D',explanation:'需测量G、h、F、s即可求出η=(Gh)/(Fs)，不需要绳子材质',score:2 },
      { id:'p95',subject:'physics',chapter:'简单机械',section:'机械效率',knowledgePoint:'有用功和额外功',type:'choice',difficulty:'easy',question:'用滑轮组提升重物时，有用功是（）',options:['A.克服动滑轮重做的功','B.克服绳重做的功','C.克服摩擦做的功','D.克服物体重力做的功'],answer:'D',explanation:'提升重物时有用功是W有用=Gh，即克服物体重力做的功',score:2 },
      { id:'p96',subject:'physics',chapter:'简单机械',section:'杠杆',knowledgePoint:'最小力问题',type:'choice',difficulty:'medium',question:'杠杆上要使动力最小，应该（）',options:['A.动力作用点尽量靠近支点','B.动力的方向与杠杆垂直','C.动力作用点离支点尽量远，且力与支点和作用点连线垂直','D.动力方向与阻力方向相反'],answer:'C',explanation:'F₁L₁=F₂L₂，F₂L₂一定，要使F₁最小需要L₁最大，即作用点最远且力臂最长',score:3 },
      { id:'p97',subject:'physics',chapter:'简单机械',section:'机械效率',knowledgePoint:'斜面效率与坡度',type:'choice',difficulty:'medium',question:'斜面越陡，机械效率一般（）',options:['A.越小','B.越大','C.不变','D.无法判断'],answer:'B',explanation:'斜面越陡→斜面越短→克服摩擦的额外功越小→机械效率越大（但越费力）',score:2 },
      { id:'p98',subject:'physics',chapter:'简单机械',section:'其他简单机械',knowledgePoint:'生活中的轮轴',type:'choice',difficulty:'medium',question:'下列属于轮轴的是（）',options:['A.天平','B.自行车车把','C.滑轮','D.筷子'],answer:'B',explanation:'自行车车把、方向盘、螺丝刀等都是轮轴的实例',score:2 },
      { id:'p99',subject:'physics',chapter:'简单机械',section:'简单机械综合',knowledgePoint:'杠杆浮力综合',type:'choice',difficulty:'hard',question:'均匀杠杆一端挂一铁球浸没水中，另一端挂等质量的铜球在空气中，杠杆平衡；将铁球提出水面后（）',options:['A.仍平衡','B.铁球端下沉','C.铜球端下沉','D.无法判断'],answer:'B',explanation:'铁球在水中受浮力，对杠杆拉力小于重力；提出水面后拉力等于重力，拉力增大→铁球端下沉',score:3 },
      { id:'p100',subject:'physics',chapter:'简单机械',section:'机械效率',knowledgePoint:'组合机械效率',type:'choice',difficulty:'medium',question:'组合机械的总机械效率等于各机械效率的（）',options:['A.和','B.平均值','C.乘积','D.最大值'],answer:'C',explanation:'组合机械的总效率η总=η₁×η₂×...，即各级效率的乘积',score:2 },
      { id:'p141',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究重力与质量关系',type:'choice',difficulty:'medium',question:'在"探究重力与质量关系"实验中，根据实验数据画出的图像应该是（）',options:['A.一条曲线','B.一条过原点的倾斜直线','C.一条水平线','D.一条抛物线'],answer:'B',explanation:'G=mg，G与m成正比，图像为过原点的倾斜直线',score:2 },
      { id:'p142',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'测量平均速度',type:'choice',difficulty:'medium',question:'在"测量物体运动的平均速度"实验中，需要的测量工具是（）',options:['A.天平和量筒','B.弹簧测力计和温度计','C.刻度尺和停表','D.电流表和电压表'],answer:'C',explanation:'v=s/t，需要刻度尺测路程，停表测时间',score:2 },
      { id:'p143',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究滑动摩擦力影响因素',type:'choice',difficulty:'medium',question:'在"探究滑动摩擦力影响因素"实验中，弹簧测力计拉着木块在水平木板上运动，读数时木块必须（）',options:['A.保持静止','B.做匀速直线运动','C.做加速运动','D.任意运动状态均可'],answer:'B',explanation:'只有匀速直线运动时，弹簧测力计的拉力才等于滑动摩擦力（二力平衡）',score:3 },
      { id:'p144',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究压力作用效果',type:'choice',difficulty:'medium',question:'在"探究压力作用效果"实验中，通过海绵凹陷程度反映压强，要探究压强与受力面积关系需控制（）不变',options:['A.受力面积','B.压力','C.海绵厚度','D.实验次数'],answer:'B',explanation:'控制变量法：探究与受力面积关系时保持压力不变',score:2 },
      { id:'p145',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究液体内部压强规律',type:'choice',difficulty:'hard',question:'用U形管压强计探究液体压强时，在同一深度改变探头方向，U形管液面差不变，说明（）',options:['A.液体压强与深度无关','B.同一深度各方向压强相等','C.液体压强只与密度有关','D.U形管压强计损坏了'],answer:'B',explanation:'同一深度各方向液面差相同，说明同一深度液体向各个方向压强相等',score:3 },
      { id:'p146',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'验证阿基米德原理',type:'choice',difficulty:'medium',question:'在验证阿基米德原理实验中，物体浸入液体前后弹簧测力计示数差等于（）',options:['A.物体的重力','B.物体排开液体的重力','C.物体的质量','D.液体的密度'],answer:'B',explanation:'F浮=G-F示，验证F浮是否等于排开液体的重力G排',score:2 },
      { id:'p147',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'测量滑轮组机械效率',type:'choice',difficulty:'hard',question:'在"测量滑轮组机械效率"实验中，影响滑轮组机械效率的主要因素是（）',options:['A.绳子的长度','B.动滑轮的重力和摩擦','C.物体的运动速度','D.拉力的方向'],answer:'B',explanation:'动滑轮越重、摩擦越大，额外功越多，机械效率越低',score:3 },
      { id:'p148',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究动能大小影响因素',type:'choice',difficulty:'medium',question:'在"探究动能与速度关系"实验中，控制质量不变改变速度的方法是（）',options:['A.用不同质量的小球','B.让同一小球从不同高度下滑','C.改变水平面的粗糙程度','D.改变木块的质量'],answer:'B',explanation:'同一小球从不同高度下滑，到达水平面速度不同（高度越大速度越大）',score:2 },
      { id:'p149',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究杠杆平衡条件',type:'choice',difficulty:'hard',question:'探究杠杆平衡条件实验中，实验前需调节杠杆在水平位置平衡，主要目的是（）',options:['A.使杠杆更稳定','B.便于测量力臂','C.美观','D.减小杠杆自重影响'],answer:'B',explanation:'杠杆水平平衡时力臂恰好等于支点到力的作用点的距离，便于在杠杆上直接读出力臂',score:3 },
      { id:'p150',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'测量固体密度',type:'choice',difficulty:'medium',question:'测量不规则小石块密度的正确步骤是（）①用天平测质量 ②用细线拴好石块 ③用量筒测水和石块总体积 ④用量筒测水的体积 ⑤计算密度',options:['A.①②③④⑤','B.①②④③⑤','C.②①④③⑤','D.①④②③⑤'],answer:'B',explanation:'先测质量再测体积，体积用排水法：先测水的体积V₁，放入石块后测总体积V₂，V石=V₂-V₁',score:2 },
      { id:'p151',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究二力平衡条件',type:'choice',difficulty:'medium',question:'在探究二力平衡实验中，使用小车代替木块放在桌面上，目的是（）',options:['A.增大摩擦','B.减小摩擦对实验的影响','C.增加小车重量','D.方便操作'],answer:'B',explanation:'小车用滚动摩擦代替滑动摩擦，减小摩擦对实验的影响',score:2 },
      { id:'p152',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究阻力对运动影响',type:'choice',difficulty:'hard',question:'伽利略斜面实验中，小车从同一高度下滑在不同粗糙程度水平面上运动，推论出：若水平面绝对光滑，小车将（）',options:['A.慢慢停下来','B.做匀速直线运动','C.做加速运动','D.静止'],answer:'B',explanation:'理想实验推论：不受阻力时物体将保持匀速直线运动（牛顿第一定律）',score:3 },
      { id:'p153',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究浮力大小影响因素',type:'choice',difficulty:'medium',question:'在探究浮力与排开液体体积关系的实验中，自变量是（）',options:['A.液体密度','B.物体浸入液体中的体积','C.物体重力','D.液体温度'],answer:'B',explanation:'自变量（要改变的量）是物体浸入液体体积，因变量（要测量的量）是浮力',score:2 },
      { id:'p154',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'测量大气压',type:'choice',difficulty:'medium',question:'托里拆利实验中，若玻璃管中混入少量空气，则测量的大气压值将（）',options:['A.偏大','B.偏小','C.不变','D.无法判断'],answer:'B',explanation:'管内混入空气会产生向下的压强，使水银柱高度减小，测量值偏小',score:3 },
      { id:'p155',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究重力势能影响因素',type:'choice',difficulty:'medium',question:'探究重力势能与高度关系时，应控制相同的变量是（）',options:['A.物体的高度','B.物体的质量','C.桌子的高度','D.地面的硬度'],answer:'B',explanation:'控制变量法：探究与高度关系时保持质量不变',score:2 },
      { id:'p156',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究滑轮组特点',type:'choice',difficulty:'medium',question:'使用滑轮组提升重物，下列说法错误的是（）',options:['A.可以省力','B.可以改变力的方向','C.可以省距离','D.不能省功'],answer:'C',explanation:'滑轮组省力但费距离（s=nh），不能省功（功的原理）',score:2 },
      { id:'p157',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'测量盐水密度',type:'choice',difficulty:'hard',question:'测量盐水密度实验中，应先测烧杯和盐水总质量还是先测空烧杯质量，哪种更好？',options:['A.先测总质量更好，可减小误差','B.先测空烧杯质量更好','C.两种方法相同','D.无法确定'],answer:'A',explanation:'先测总质量再倒出部分盐水，避免烧杯壁残留导致的误差',score:3 },
      { id:'p158',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究弹性势能',type:'choice',difficulty:'medium',question:'弹性势能的大小与（）有关',options:['A.物体的质量','B.物体弹性形变的程度','C.物体的速度','D.物体的高度'],answer:'B',explanation:'同一物体弹性形变越大，弹性势能越大',score:2 },
      { id:'p159',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'设计实验测机械效率',type:'choice',difficulty:'hard',question:'要测量斜面的机械效率，不需要测量的物理量是（）',options:['A.物体重力G','B.斜面高度h','C.拉力F和斜面长s','D.物体运动的速度'],answer:'D',explanation:'η=Gh/(Fs)，不需要测量速度',score:3 },
      { id:'p160',subject:'physics',chapter:'实验探究',section:'力学实验',knowledgePoint:'探究杠杆分类',type:'choice',difficulty:'medium',question:'下列工具在使用时属于省力杠杆的是（）',options:['A.镊子','B.筷子','C.剪铁皮的剪刀','D.钓鱼竿'],answer:'C',explanation:'剪铁皮的剪刀动力臂大于阻力臂，是省力杠杆。镊子、筷子、钓鱼竿都是费力杠杆',score:2 }
    ],
    grade9_preview: [
      { id:'p161',subject:'physics',chapter:'内能',section:'分子热运动',knowledgePoint:'扩散现象',type:'choice',difficulty:'easy',question:'下列现象中属于扩散现象的是（）',options:['A.柳絮飞扬','B.灰尘飞舞','C.花香四溢','D.雪花飘飘'],answer:'C',explanation:'扩散是分子运动的结果，花香四溢是花的香味分子扩散到空气中。柳絮、灰尘、雪花是宏观机械运动',score:2 },
      { id:'p162',subject:'physics',chapter:'内能',section:'内能',knowledgePoint:'内能概念',type:'choice',difficulty:'medium',question:'关于内能，下列说法正确的是（）',options:['A.0℃的物体没有内能','B.物体内能增大温度一定升高','C.一切物体都有内能','D.温度高的物体内能一定大'],answer:'C',explanation:'一切物体都有内能（分子永不停息地运动）；晶体熔化时吸热内能增大但温度不变',score:2 },
      { id:'p163',subject:'physics',chapter:'内能',section:'内能',knowledgePoint:'改变内能的方法',type:'choice',difficulty:'easy',question:'下列改变内能的方式中，与另外三种不同的是（）',options:['A.钻木取火','B.双手摩擦生热','C.用热水袋取暖','D.锯木头时锯条发热'],answer:'C',explanation:'C是热传递改变内能；A、B、D都是做功改变内能',score:2 },
      { id:'p164',subject:'physics',chapter:'内能',section:'比热容',knowledgePoint:'比热容概念',type:'choice',difficulty:'medium',question:'关于比热容，下列说法正确的是（）',options:['A.比热容与物体吸收热量成正比','B.比热容是物质的特性之一','C.比热容与物体温度变化有关','D.比热容与物体质量有关'],answer:'B',explanation:'比热容是物质的一种特性，与质量、温度、吸放热多少无关',score:2 },
      { id:'p165',subject:'physics',chapter:'内能',section:'比热容',knowledgePoint:'热量计算Q=cmΔt',type:'choice',difficulty:'hard',question:'质量相等的水和砂石吸收相同热量后，升高的温度之比为1:4，则水和砂石比热容之比为（）',options:['A.1:4','B.4:1','C.1:1','D.2:1'],answer:'B',explanation:'Q=cmΔt，m和Q相同，c与Δt成反比，c水:c石=Δt石:Δt水=4:1',score:3 },
      { id:'p166',subject:'physics',chapter:'内能',section:'内能的利用',knowledgePoint:'热值概念',type:'choice',difficulty:'medium',question:'关于燃料的热值，下列说法正确的是（）',options:['A.燃料燃烧越充分热值越大','B.热值是燃料的一种特性','C.热值与燃料质量有关','D.热值与燃料燃烧放出的热量成正比'],answer:'B',explanation:'热值是燃料的特性，只与燃料种类有关，与质量、燃烧充分程度无关',score:2 },
      { id:'p167',subject:'physics',chapter:'内能',section:'内能的利用',knowledgePoint:'热效率计算',type:'choice',difficulty:'hard',question:'某热机效率为30%，完全燃烧10kg汽油（热值4.6×10⁷J/kg），对外做的有用功为（）',options:['A.1.38×10⁸J','B.4.6×10⁸J','C.1.38×10⁷J','D.3.22×10⁸J'],answer:'A',explanation:'Q放=mq=10×4.6×10⁷=4.6×10⁸J，W有用=ηQ放=30%×4.6×10⁸=1.38×10⁸J',score:3 },
      { id:'p168',subject:'physics',chapter:'内能',section:'分子热运动',knowledgePoint:'分子动理论',type:'choice',difficulty:'easy',question:'"破镜不能重圆"是因为（）',options:['A.分子间没有引力','B.分子间只有斥力','C.分子间距离太大，引力很小','D.分子停止了运动'],answer:'C',explanation:'分子间作用力在距离很小时才明显，镜子破碎后分子间距太大，引力几乎为零',score:2 },
      { id:'p169',subject:'physics',chapter:'内能',section:'内能',knowledgePoint:'温度内能热量辨析',type:'choice',difficulty:'medium',question:'关于温度、内能、热量，下列说法正确的是（）',options:['A.温度高的物体含有的热量多','B.物体温度升高，内能一定增加','C.物体温度为0℃时内能为零','D.热量总是从内能大的物体传给内能小的物体'],answer:'B',explanation:'温度升高→分子动能增大→内能增大。热量是过程量不能说"含有"；热量从高温→低温',score:2 },
      { id:'p170',subject:'physics',chapter:'内能',section:'比热容',knowledgePoint:'比热容实验',type:'choice',difficulty:'hard',question:'在"比较不同物质吸热能力"实验中，用相同的加热器加热质量相等的水和食用油，下列分析正确的是（）',options:['A.加热时间相同，升温高的吸热能力强','B.升高相同温度，加热时间短的吸热能力强','C.升高相同温度，加热时间长的吸热能力强','D.加热时间相同，升温相同的吸热能力强'],answer:'C',explanation:'相同加热器→加热时间代表吸收热量。升高相同温度时加热时间越长→吸收热量越多→比热容越大→吸热能力越强',score:3 },
      { id:'p171',subject:'physics',chapter:'电流和电路',section:'两种电荷',knowledgePoint:'电荷基本知识',type:'choice',difficulty:'easy',question:'自然界中只存在（）种电荷',options:['A.一','B.两','C.三','D.四'],answer:'B',explanation:'自然界只有正电荷和负电荷两种。同种电荷相互排斥，异种电荷相互吸引',score:2 },
      { id:'p172',subject:'physics',chapter:'电流和电路',section:'电流和电路',knowledgePoint:'电路的状态',type:'choice',difficulty:'medium',question:'电路有三种状态：通路、断路和（）',options:['A.开路','B.短路','C.闭路','D.回路'],answer:'B',explanation:'电路三种状态：通路（正常工作）、断路（断开）、短路（不经过用电器直接接通）',score:2 },
      { id:'p173',subject:'physics',chapter:'电流和电路',section:'电流和电路',knowledgePoint:'电流方向',type:'choice',difficulty:'easy',question:'在电路中，规定电流方向为（）定向移动的方向',options:['A.自由电子','B.负电荷','C.正电荷','D.原子核'],answer:'C',explanation:'物理学规定正电荷定向移动的方向为电流方向。金属中实际是自由电子移动，电子方向与电流方向相反',score:2 },
      { id:'p174',subject:'physics',chapter:'电流和电路',section:'串联和并联',knowledgePoint:'串并联特点',type:'choice',difficulty:'medium',question:'教室里的日光灯之间是（）连接的',options:['A.串联','B.并联','C.混联','D.无法确定'],answer:'B',explanation:'并联电路各支路独立工作互不影响，一盏灯坏了其他灯仍亮',score:2 },
      { id:'p175',subject:'physics',chapter:'电流和电路',section:'串联和并联',knowledgePoint:'电路图分析',type:'choice',difficulty:'hard',question:'在一个电路中，闭合开关后两灯都亮，拧掉其中一盏灯另一盏也灭了，这两盏灯是（）',options:['A.串联','B.并联','C.可能串联也可能并联','D.无法判断'],answer:'A',explanation:'串联电路各用电器互相影响，一个断开全部断路',score:3 },
      { id:'p176',subject:'physics',chapter:'电流和电路',section:'电流的测量',knowledgePoint:'电流表使用',type:'choice',difficulty:'medium',question:'使用电流表时，下列说法正确的是（）',options:['A.电流表可以直接接在电源两极','B.电流表应与被测电路并联','C.电流应从电流表正接线柱流入','D.电流表不需要估测量程'],answer:'C',explanation:'电流表应串联在电路中，正接线柱流入负接线柱流出。不能直接接电源两极（会烧坏）',score:2 },
      { id:'p177',subject:'physics',chapter:'电流和电路',section:'导体和绝缘体',knowledgePoint:'导体绝缘体',type:'choice',difficulty:'easy',question:'下列物质中属于导体的是（）',options:['A.橡胶','B.玻璃','C.石墨','D.塑料'],answer:'C',explanation:'石墨是导体（有自由电子）；橡胶、玻璃、塑料是绝缘体',score:2 },
      { id:'p178',subject:'physics',chapter:'电流和电路',section:'电流的测量',knowledgePoint:'探究串并联电流规律',type:'choice',difficulty:'medium',question:'在"探究串联电路电流规律"实验中，用电流表分别测量电路中不同位置的电流，发现它们的关系是（）',options:['A.各处电流相等','B.支路电流等于干路电流','C.电流处处不等','D.与用电器多少有关'],answer:'A',explanation:'串联电路中电流处处相等',score:2 },
      { id:'p179',subject:'physics',chapter:'电流和电路',section:'串联和并联',knowledgePoint:'电路故障分析',type:'choice',difficulty:'hard',question:'电路中两盏灯串联，闭合开关后一盏灯亮一盏灯不亮，故障原因可能是（）',options:['A.不亮的灯短路','B.不亮的灯断路','C.亮的灯短路','D.电源没电'],answer:'A',explanation:'串联电路一盏灯短路后相当于一段导线，电流仍可通过，另一盏灯仍亮。若断路则全灭',score:3 },
      { id:'p180',subject:'physics',chapter:'电流和电路',section:'串联和并联',knowledgePoint:'根据实物画电路图',type:'choice',difficulty:'medium',question:'在并联电路中，干路开关控制（），支路开关控制（）',options:['A.所有用电器；本支路用电器','B.本支路用电器；所有用电器','C.都不控制','D.电流大小'],answer:'A',explanation:'并联电路中，干路开关控制整个电路的所有用电器，支路开关只控制该支路的用电器',score:2 },
      { id:'p181',subject:'physics',chapter:'欧姆定律',section:'电阻',knowledgePoint:'电阻概念',type:'choice',difficulty:'easy',question:'电阻表示导体对（）的阻碍作用',options:['A.电压','B.电流','C.电功率','D.电能'],answer:'B',explanation:'电阻是导体对电流的阻碍作用，单位是欧姆(Ω)',score:2 },
      { id:'p182',subject:'physics',chapter:'欧姆定律',section:'欧姆定律',knowledgePoint:'欧姆定律公式',type:'choice',difficulty:'medium',question:'欧姆定律的表达式是（）',options:['A.R=U/I','B.I=U/R','C.U=IR','D.P=UI'],answer:'B',explanation:'欧姆定律：I=U/R，即导体中电流与两端电压成正比，与电阻成反比',score:2 },
      { id:'p183',subject:'physics',chapter:'欧姆定律',section:'欧姆定律',knowledgePoint:'欧姆定律计算',type:'choice',difficulty:'hard',question:'一个电阻两端加6V电压时电流为0.3A，若电压增加到9V，电流是（）',options:['A.0.2A','B.0.45A','C.0.3A','D.0.6A'],answer:'B',explanation:'电阻R=U/I=6/0.3=20Ω不变，I\'=U\'/R=9/20=0.45A',score:3 },
      { id:'p184',subject:'physics',chapter:'欧姆定律',section:'电阻',knowledgePoint:'电阻影响因素',type:'choice',difficulty:'medium',question:'导体的电阻大小与下列因素无关的是（）',options:['A.导体的材料','B.导体的长度','C.导体两端的电压','D.导体的横截面积'],answer:'C',explanation:'电阻是导体本身属性，与材料、长度、横截面积和温度有关，与电压和电流无关',score:2 },
      { id:'p185',subject:'physics',chapter:'欧姆定律',section:'变阻器',knowledgePoint:'滑动变阻器使用',type:'choice',difficulty:'easy',question:'使用滑动变阻器时，应将滑动变阻器（）接入电路',options:['A.并联','B.串联','C.既可以串也可以并','D.直接接电源两极'],answer:'B',explanation:'滑动变阻器应串联在电路中才能改变电路中的电流',score:2 },
      { id:'p186',subject:'physics',chapter:'欧姆定律',section:'欧姆定律',knowledgePoint:'探究电流与电压关系',type:'choice',difficulty:'medium',question:'在"探究电流与电压关系"实验中，应控制不变的量是（）',options:['A.电压','B.电流','C.电阻','D.电功率'],answer:'C',explanation:'控制变量法：探究I与U关系时保持R不变；探究I与R关系时保持U不变',score:2 },
      { id:'p187',subject:'physics',chapter:'欧姆定律',section:'欧姆定律应用',knowledgePoint:'动态电路分析',type:'choice',difficulty:'hard',question:'串联电路中，滑动变阻器滑片向阻值增大方向移动时，定值电阻两端的电压将（）',options:['A.增大','B.减小','C.不变','D.无法判断'],answer:'B',explanation:'串联分压：变阻器阻值增大→其分得电压增大→定值电阻两端电压减小',score:3 },
      { id:'p188',subject:'physics',chapter:'欧姆定律',section:'电阻的测量',knowledgePoint:'伏安法测电阻',type:'choice',difficulty:'medium',question:'"伏安法"测电阻的原理是（）',options:['A.I=U/R','B.R=U/I','C.P=UI','D.Q=I²Rt'],answer:'B',explanation:'伏安法测电阻：用电压表测电压U、电流表测电流I，R=U/I',score:2 },
      { id:'p189',subject:'physics',chapter:'欧姆定律',section:'欧姆定律应用',knowledgePoint:'串并联电阻',type:'choice',difficulty:'hard',question:'两个电阻R₁=6Ω和R₂=3Ω并联，总电阻为（）',options:['A.9Ω','B.2Ω','C.4.5Ω','D.18Ω'],answer:'B',explanation:'并联总电阻R=R₁R₂/(R₁+R₂)=6×3/(6+3)=18/9=2Ω',score:3 },
      { id:'p190',subject:'physics',chapter:'欧姆定律',section:'变阻器',knowledgePoint:'变阻器原理',type:'choice',difficulty:'easy',question:'滑动变阻器是通过改变接入电路中电阻丝的（）来改变电阻的',options:['A.材料','B.横截面积','C.长度','D.温度'],answer:'C',explanation:'滑动变阻器通过移动滑片改变接入电路电阻丝的长度来改变电阻',score:2 },
      { id:'p191',subject:'physics',chapter:'电功率',section:'电能 电功',knowledgePoint:'电能单位',type:'choice',difficulty:'easy',question:'电能的国际单位是（）',options:['A.瓦特(W)','B.焦耳(J)','C.伏特(V)','D.安培(A)'],answer:'B',explanation:'电能和电功的国际单位都是焦耳(J)，生活中常用千瓦时(kW·h)',score:2 },
      { id:'p192',subject:'physics',chapter:'电功率',section:'电功率',knowledgePoint:'电功率公式',type:'choice',difficulty:'medium',question:'电功率的计算公式P=UI中，U表示（）',options:['A.电流','B.电压','C.电阻','D.电能'],answer:'B',explanation:'P=UI，U是电压（单位V），I是电流（单位A），P是电功率（单位W）',score:2 },
      { id:'p193',subject:'physics',chapter:'电功率',section:'电功率',knowledgePoint:'电功率综合计算',type:'choice',difficulty:'hard',question:'一个标有"220V 100W"的灯泡，正常工作时的电流约为（）',options:['A.0.22A','B.0.45A','C.2.2A','D.4.5A'],answer:'B',explanation:'I=P/U=100/220≈0.45A',score:3 },
      { id:'p194',subject:'physics',chapter:'电功率',section:'电功率',knowledgePoint:'额定功率与实际功率',type:'choice',difficulty:'medium',question:'一个灯泡上标有"220V 40W"，表示（）',options:['A.灯泡一定能发出40W的功率','B.220V是额定电压，40W是额定功率','C.灯泡的功率恒为40W','D.灯泡在任意电压下功率都为40W'],answer:'B',explanation:'额定电压220V是指灯泡正常工作的电压，额定功率40W是额定电压下的功率。实际功率随实际电压变化',score:2 },
      { id:'p195',subject:'physics',chapter:'电功率',section:'电能 电功',knowledgePoint:'电能表',type:'choice',difficulty:'easy',question:'电能表是用来测量（）的仪表',options:['A.电流','B.电压','C.电功（电能）','D.电功率'],answer:'C',explanation:'电能表（电度表）测量用电器消耗电能的多少，单位是千瓦时',score:2 },
      { id:'p196',subject:'physics',chapter:'电功率',section:'焦耳定律',knowledgePoint:'焦耳定律',type:'choice',difficulty:'medium',question:'焦耳定律Q=I²Rt表明，电流通过导体产生的热量与（）成正比',options:['A.电流','B.电流的平方','C.电阻的平方','D.时间的平方'],answer:'B',explanation:'Q=I²Rt，热量与电流的平方、电阻、通电时间成正比',score:2 },
      { id:'p197',subject:'physics',chapter:'电功率',section:'焦耳定律',knowledgePoint:'多档位电热器',type:'choice',difficulty:'hard',question:'一个电热器有两根电热丝，两根串联时功率为P₁，并联时功率为P₂，则P₁:P₂为（）（电源电压不变）',options:['A.1:2','B.1:4','C.2:1','D.4:1'],answer:'B',explanation:'设每根电阻为R，串联R总=2R，P₁=U²/2R；并联R总=R/2，P₂=2U²/R。P₁:P₂=(U²/2R):(2U²/R)=1:4',score:3 },
      { id:'p198',subject:'physics',chapter:'电功率',section:'电功率',knowledgePoint:'测量小灯泡电功率',type:'choice',difficulty:'medium',question:'在"测量小灯泡的电功率"实验中，需要测量的物理量是（）',options:['A.电压和电阻','B.电流和电阻','C.电压和电流','D.电压和时间'],answer:'C',explanation:'P=UI，需用电压表测灯泡两端电压，电流表测通过灯泡的电流',score:2 },
      { id:'p199',subject:'physics',chapter:'电功率',section:'电能 电功',knowledgePoint:'电功与电功率',type:'choice',difficulty:'medium',question:'1度电可以供一个40W的灯泡正常发光（）小时',options:['A.10','B.20','C.25','D.40'],answer:'C',explanation:'1度电=1kW·h=1000W·h，t=W/P=1000/40=25h',score:2 },
      { id:'p200',subject:'physics',chapter:'电功率',section:'电功率',knowledgePoint:'电功率图像',type:'choice',difficulty:'hard',question:'某灯泡的I-U图像不是直线，说明（）',options:['A.灯泡是纯电阻','B.灯泡电阻随温度变化','C.欧姆定律不适用','D.灯泡的电流与电压无关'],answer:'B',explanation:'灯丝电阻随温度升高而增大，因此I-U图像不是直线（曲线上翘说明电阻增大）',score:3 }
    ],
  },
  english: {
    // ==================== 七年级（30题）====================
    grade7_down: [
      // ---- 一般现在时 (8题: easy3/medium3/hard2) ----
      { id:'e101',subject:'english',chapter:'一般现在时',section:'一般现在时',knowledgePoint:'动词第三人称单数',type:'choice',difficulty:'easy',question:'My brother _____ to school by bus every day.',options:['A.go','B.goes','C.going','D.went'],answer:'B',explanation:'every day提示一般现在时，主语My brother是第三人称单数，动词加-s/es',score:2 },
      { id:'e102',subject:'english',chapter:'一般现在时',section:'一般现在时',knowledgePoint:'否定句',type:'choice',difficulty:'easy',question:'She _____ like apples. She likes oranges.',options:['A.don\'t','B.doesn\'t','C.isn\'t','D.aren\'t'],answer:'B',explanation:'一般现在时第三人称单数否定用doesn\'t+动词原形',score:2 },
      { id:'e103',subject:'english',chapter:'一般现在时',section:'一般现在时',knowledgePoint:'疑问句',type:'choice',difficulty:'easy',question:'_____ your parents often watch TV after dinner?',options:['A.Do','B.Does','C.Is','D.Are'],answer:'A',explanation:'主语your parents是复数，一般现在时疑问句用Do+主语+动词原形',score:2 },
      { id:'e104',subject:'english',chapter:'一般现在时',section:'一般现在时',knowledgePoint:'频率副词',type:'choice',difficulty:'medium',question:'Tom is a good student. He _____ late for school.',options:['A.is always','B.always is','C.is never','D.never is'],answer:'C',explanation:'频度副词放在be动词之后，根据句意"好学生"应选never表示"从不迟到"',score:2 },
      { id:'e105',subject:'english',chapter:'一般现在时',section:'一般现在时',knowledgePoint:'一般现在时表客观真理',type:'choice',difficulty:'medium',question:'The teacher said that the earth _____ around the sun.',options:['A.move','B.moves','C.moved','D.is moving'],answer:'B',explanation:'客观真理用一般现在时，不受主句时态影响',score:2 },
      { id:'e106',subject:'english',chapter:'一般现在时',section:'一般现在时',knowledgePoint:'一般现在时综合',type:'choice',difficulty:'medium',question:'He usually _____ TV on weekends, but he _____ it last weekend.',options:['A.watches;doesn\'t watch','B.watch;didn\'t watch','C.watches;didn\'t watch','D.watched;doesn\'t watch'],answer:'C',explanation:'usually提示一般现在时，last weekend提示一般过去时',score:2 },
      { id:'e107',subject:'english',chapter:'一般现在时',section:'一般现在时',knowledgePoint:'一般现在时与主谓一致',type:'choice',difficulty:'hard',question:'Neither the teacher nor the students _____ in the classroom now.',options:['A.is','B.are','C.was','D.has been'],answer:'B',explanation:'neither...nor...遵循就近原则，students是复数，用are',score:2 },
      { id:'e108',subject:'english',chapter:'一般现在时',section:'一般现在时',knowledgePoint:'一般现在时表将来',type:'choice',difficulty:'hard',question:'The train _____ at 8:00 tomorrow morning. Don\'t be late.',options:['A.leaves','B.is leaving','C.left','D.will leave'],answer:'A',explanation:'按时刻表发生的动作，用一般现在时表将来',score:2 },

      // ---- 现在进行时 (8题: easy3/medium3/hard2) ----
      { id:'e109',subject:'english',chapter:'现在进行时',section:'现在进行时',knowledgePoint:'现在进行时结构',type:'choice',difficulty:'easy',question:'Look! The children _____ games in the park.',options:['A.play','B.played','C.are playing','D.were playing'],answer:'C',explanation:'Look!提示正在发生的动作，用现在进行时be+doing',score:2 },
      { id:'e110',subject:'english',chapter:'现在进行时',section:'现在进行时',knowledgePoint:'现在分词变化',type:'choice',difficulty:'easy',question:'The boy is _____ in the river now.',options:['A.swiming','B.swimming','C.swim','D.swims'],answer:'B',explanation:'swim重读闭音节结尾，双写m+ing',score:2 },
      { id:'e111',subject:'english',chapter:'现在进行时',section:'现在进行时',knowledgePoint:'否定句',type:'choice',difficulty:'easy',question:'Listen! Someone _____ in the next room.',options:['A.is singing','B.sings','C.sang','D.are singing'],answer:'A',explanation:'Listen!提示正在发生，Someone是不定代词作主语用单数',score:2 },
      { id:'e112',subject:'english',chapter:'现在进行时',section:'现在进行时',knowledgePoint:'现在进行时表将来',type:'choice',difficulty:'medium',question:'We _____ for Shanghai tomorrow. We have booked the tickets.',options:['A.leave','B.left','C.are leaving','D.were leaving'],answer:'C',explanation:'用现在进行时表计划好的近期将来动作',score:2 },
      { id:'e113',subject:'english',chapter:'现在进行时',section:'现在进行时',knowledgePoint:'现在进行时疑问句',type:'choice',difficulty:'medium',question:'—What _____ you _____? —I\'m reading a novel.',options:['A.do;read','B.did;read','C.are;reading','D.were;reading'],answer:'C',explanation:'答语用现在进行时，问句也应用现在进行时',score:2 },
      { id:'e114',subject:'english',chapter:'现在进行时',section:'现在进行时',knowledgePoint:'always表感情色彩',type:'choice',difficulty:'medium',question:'He _____ always _____ about others. He is so kind.',options:['A.is;thinking','B.does;think','C.has;thought','D.was;thinking'],answer:'A',explanation:'现在进行时与always连用表示赞赏的感情色彩',score:2 },
      { id:'e115',subject:'english',chapter:'现在进行时',section:'现在进行时',knowledgePoint:'不用于进行时的动词',type:'choice',difficulty:'hard',question:'Which sentence is WRONG?',options:['A.I am knowing the answer.','B.I know the answer.','C.He is having lunch now.','D.She is listening to music.'],answer:'A',explanation:'know是状态动词，不用于进行时',score:2 },
      { id:'e116',subject:'english',chapter:'现在进行时',section:'现在进行时',knowledgePoint:'现在进行时综合',type:'choice',difficulty:'hard',question:'Don\'t turn off the computer. I _____ it.',options:['A.use','B.used','C.am using','D.was using'],answer:'C',explanation:'"不要关电脑"说明正在使用中，用现在进行时',score:2 },

      // ---- 情态动词can/must (7题: easy3/medium3/hard1) ----
      { id:'e117',subject:'english',chapter:'情态动词',section:'情态动词can/must',knowledgePoint:'can表能力',type:'choice',difficulty:'easy',question:'My little sister _____ play the piano very well. She started learning at age four.',options:['A.can','B.must','C.should','D.need'],answer:'A',explanation:'can表示能力"会、能"',score:2 },
      { id:'e118',subject:'english',chapter:'情态动词',section:'情态动词can/must',knowledgePoint:'must表必须',type:'choice',difficulty:'easy',question:'You _____ cross the road when the traffic light is red.',options:['A.can','B.must','C.mustn\'t','D.needn\'t'],answer:'C',explanation:'mustn\'t表示"禁止、不允许"',score:2 },
      { id:'e119',subject:'english',chapter:'情态动词',section:'情态动词can/must',knowledgePoint:'can表请求',type:'choice',difficulty:'easy',question:'—_____ I borrow your pen? —Sure. Here you are.',options:['A.Must','B.Need','C.Should','D.Can'],answer:'D',explanation:'Can I...? 表示礼貌请求"我可以...吗?"',score:2 },
      { id:'e120',subject:'english',chapter:'情态动词',section:'情态动词can/must',knowledgePoint:'must/have to区别',type:'choice',difficulty:'medium',question:'It\'s getting dark. I _____ go home now.',options:['A.can','B.must','C.may','D.would'],answer:'B',explanation:'must表示主观"必须"，have to表示客观"不得不"',score:2 },
      { id:'e121',subject:'english',chapter:'情态动词',section:'情态动词can/must',knowledgePoint:'mustn\'t/needn\'t区别',type:'choice',difficulty:'medium',question:'—Must I hand in my homework today? —No, you _____. You can hand it in tomorrow.',options:['A.mustn\'t','B.can\'t','C.needn\'t','D.shouldn\'t'],answer:'C',explanation:'Must I...?肯定回答Yes,you must. 否定回答No,you needn\'t/don\'t have to.',score:2 },
      { id:'e122',subject:'english',chapter:'情态动词',section:'情态动词can/must',knowledgePoint:'must表推测',type:'choice',difficulty:'medium',question:'There is a light in his room. He _____ be at home.',options:['A.can','B.must','C.should','D.will'],answer:'B',explanation:'must表示肯定推测"一定、准是"',score:2 },
      { id:'e123',subject:'english',chapter:'情态动词',section:'情态动词can/must',knowledgePoint:'can\'t表否定推测',type:'choice',difficulty:'hard',question:'That man _____ be Mr. Wang. Mr. Wang has gone to Beijing.',options:['A.must','B.can\'t','C.should','D.needn\'t'],answer:'B',explanation:'can\'t表示否定推测"不可能"',score:2 },

      // ---- there be句型 (7题: easy3/medium3/hard1) ----
      { id:'e124',subject:'english',chapter:'there be句型',section:'there be句型',knowledgePoint:'there be基本结构',type:'choice',difficulty:'easy',question:'_____ a book and two pens on the desk.',options:['A.There is','B.There are','C.There have','D.There has'],answer:'A',explanation:'there be遵循就近原则，a book是单数，用is',score:2 },
      { id:'e125',subject:'english',chapter:'there be句型',section:'there be句型',knowledgePoint:'there be就近原则',type:'choice',difficulty:'easy',question:'_____ any milk in the glass?',options:['A.Is there','B.Are there','C.There is','D.There are'],answer:'A',explanation:'milk是不可数名词，用is there',score:2 },
      { id:'e126',subject:'english',chapter:'there be句型',section:'there be句型',knowledgePoint:'there be否定句',type:'choice',difficulty:'easy',question:'There _____ any students in the classroom yesterday.',options:['A.isn\'t','B.aren\'t','C.weren\'t','D.wasn\'t'],answer:'C',explanation:'yesterday提示过去时，students复数，用weren\'t',score:2 },
      { id:'e127',subject:'english',chapter:'there be句型',section:'there be句型',knowledgePoint:'there be将来时',type:'choice',difficulty:'medium',question:'There _____ a sports meeting next Friday.',options:['A.is','B.was','C.will be','D.has been'],answer:'C',explanation:'next Friday提示将来时，there be将来时为there will be',score:2 },
      { id:'e128',subject:'english',chapter:'there be句型',section:'there be句型',knowledgePoint:'there be与have区别',type:'choice',difficulty:'medium',question:'_____ two windows and a door in my room.',options:['A.There is','B.There are','C.It has','D.I have'],answer:'B',explanation:'there be表"某处存在"，就近原则two windows复数用are；have表"某人拥有"',score:2 },
      { id:'e129',subject:'english',chapter:'there be句型',section:'there be句型',knowledgePoint:'there be+doing',type:'choice',difficulty:'medium',question:'There are many students _____ basketball on the playground.',options:['A.play','B.played','C.playing','D.to play'],answer:'C',explanation:'there be+名词+doing表示"有...正在做..."',score:2 },
      { id:'e130',subject:'english',chapter:'there be句型',section:'there be句型',knowledgePoint:'there be综合',type:'choice',difficulty:'hard',question:'—There _____ a talk show on TV tonight. —Really? That sounds great.',options:['A.is going to have','B.is going to be','C.will have','D.has'],answer:'B',explanation:'there be的将来时可用there is going to be或there will be',score:2 },
    ],

    // ==================== 八年级（100题，重点）====================
    grade8_down: [
      // ---- 现有题目 e01-e11 ----
      { id:'e01',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'have/has done',type:'choice',difficulty:'medium',question:'She _____ already _____ her homework.',options:['A.has,finish','B.have,finished','C.has,finished','D.is,finishing'],answer:'C',explanation:'第三人称用has，already提示现在完成时',score:2 },
      { id:'e02',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'since/for',type:'choice',difficulty:'medium',question:'I have lived here _____ 2018.',options:['A.for','B.since','C.in','D.from'],answer:'B',explanation:'since+时间点，for+时间段',score:2 },
      { id:'e03',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'ever/never',type:'choice',difficulty:'easy',question:'Have you _____ been to Beijing?',options:['A.ever','B.never','C.yet','D.already'],answer:'A',explanation:'ever用于疑问句询问"曾经"',score:2 },
      { id:'e04',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'was/were doing',type:'choice',difficulty:'medium',question:'When I saw him, he _____ basketball.',options:['A.plays','B.played','C.was playing','D.is playing'],answer:'C',explanation:'过去某个时间正在发生的动作用过去进行时',score:2 },
      { id:'e05',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'when/while',type:'choice',difficulty:'medium',question:'_____ I was reading, my mother was cooking.',options:['A.When','B.While','C.Before','D.After'],answer:'B',explanation:'while连接两个同时进行的持续性动作',score:2 },
      { id:'e06',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'比较级句型',type:'choice',difficulty:'easy',question:'Tom is _____ than his brother.',options:['A.tall','B.taller','C.tallest','D.the tallest'],answer:'B',explanation:'两者比较用比较级，than是标志词',score:2 },
      { id:'e07',subject:'english',chapter:'比较级最高级',section:'形容词最高级',knowledgePoint:'最高级',type:'choice',difficulty:'medium',question:'China is one of _____ countries in the world.',options:['A.large','B.larger','C.largest','D.the largest'],answer:'D',explanation:'one of+最高级+复数名词，最高级前加the',score:2 },
      { id:'e08',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'should/could',type:'choice',difficulty:'easy',question:'You _____ drink more water. It\'s good for you.',options:['A.should','B.must','C.can\'t','D.needn\'t'],answer:'A',explanation:'should表示建议"应该"',score:2 },
      { id:'e09',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'unless/as soon as',type:'choice',difficulty:'medium',question:'I will call you _____ I arrive at the station.',options:['A.unless','B.as soon as','C.although','D.because'],answer:'B',explanation:'as soon as表示"一...就..."',score:2 },
      { id:'e10',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'to do用法',type:'choice',difficulty:'medium',question:'He wants _____ a doctor when he grows up.',options:['A.be','B.being','C.to be','D.been'],answer:'C',explanation:'want to do sth. 想要做某事',score:2 },
      { id:'e11',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'already/yet',type:'choice',difficulty:'easy',question:'Have you finished your work _____?',options:['A.already','B.yet','C.just','D.ever'],answer:'B',explanation:'yet用于疑问句和否定句，already用于肯定句',score:2 },

      // ---- 现在完成时 补充16题(e201-e216) 共20题 ----
      { id:'e201',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'现在完成时基本结构',type:'choice',difficulty:'easy',question:'They _____ the Great Wall twice already.',options:['A.have visited','B.visited','C.are visiting','D.were visiting'],answer:'A',explanation:'already提示现在完成时，复数用have done',score:2 },
      { id:'e202',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'have been to',type:'choice',difficulty:'easy',question:'My father _____ Shanghai many times.',options:['A.has been to','B.has gone to','C.went to','D.goes to'],answer:'A',explanation:'have been to表示"去过"(已返回)，have gone to表示"去了"(未返回)',score:2 },
      { id:'e203',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'have gone to',type:'choice',difficulty:'easy',question:'—Where is Tom? —He _____ the library.',options:['A.has been to','B.has gone to','C.went to','D.goes to'],answer:'B',explanation:'Tom不在此处，去了还没回来，用has gone to',score:2 },
      { id:'e204',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'现在完成时与一般过去时',type:'choice',difficulty:'medium',question:'I _____ my homework. I _____ it an hour ago.',options:['A.finished;have finished','B.have finished;finished','C.finished;finished','D.have finished;have finished'],answer:'B',explanation:'强调结果用现在完成时，有具体过去时间(an hour ago)用一般过去时',score:2 },
      { id:'e205',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'just用法',type:'choice',difficulty:'easy',question:'Don\'t worry. I have _____ finished the work.',options:['A.just','B.yet','C.ever','D.never'],answer:'A',explanation:'just用于现在完成时表示"刚刚"，用于肯定句',score:2 },
      { id:'e206',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'现在完成时持续时间',type:'choice',difficulty:'medium',question:'His grandfather _____ for ten years.',options:['A.has died','B.has been dead','C.died','D.was dead'],answer:'B',explanation:'die是非延续性动词，不能与for时间段连用，需换成be dead',score:2 },
      { id:'e207',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'ever/never辨析',type:'choice',difficulty:'easy',question:'This is the most interesting movie I _____ seen.',options:['A.ever','B.never','C.yet','D.already'],answer:'A',explanation:'This is the+最高级+I have ever... 是常见句型',score:2 },
      { id:'e208',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'so far',type:'choice',difficulty:'medium',question:'So far, the students _____ more than 200 English words.',options:['A.learn','B.have learned','C.learned','D.are learning'],answer:'B',explanation:'so far"到目前为止"是现在完成时的标志词',score:2 },
      { id:'e209',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'次数表达',type:'choice',difficulty:'medium',question:'She _____ the film three times so far.',options:['A.sees','B.was seeing','C.has seen','D.will see'],answer:'C',explanation:'three times和so far提示现在完成时',score:2 },
      { id:'e210',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'in the past few years',type:'choice',difficulty:'medium',question:'Great changes _____ in our hometown in the past few years.',options:['A.took place','B.have taken place','C.were taking place','D.take place'],answer:'B',explanation:'in the past few years"在过去的几年里"是现在完成时标志',score:2 },
      { id:'e211',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'延续性动词转换',type:'choice',difficulty:'hard',question:'—How long may I _____ the book? —For two weeks.',options:['A.borrow','B.lend','C.keep','D.buy'],answer:'C',explanation:'borrow/buy是非延续性动词，与时间段连用需换成keep/have',score:2 },
      { id:'e212',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'延续性动词综合',type:'choice',difficulty:'hard',question:'The film _____ for ten minutes when we got there.',options:['A.has started','B.had been on','C.started','D.was starting'],answer:'B',explanation:'for ten minutes是时间段，start非延续，需用be on；got提示用过去完成时',score:2 },
      { id:'e213',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'have been in',type:'choice',difficulty:'medium',question:'Mr. Green _____ China for three years and he likes living here.',options:['A.has been in','B.has been to','C.has gone to','D.went to'],answer:'A',explanation:'has been in表示"在某地待了多久"(延续)',score:2 },
      { id:'e214',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'现在完成时的肯定回答',type:'choice',difficulty:'easy',question:'—Have you ever been to Paris? —Yes, I _____.',options:['A.do','B.did','C.have','D.was'],answer:'C',explanation:'现在完成时的一般疑问句肯定回答用Yes, I have.',score:2 },
      { id:'e215',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'句型转换',type:'choice',difficulty:'medium',question:'He joined the army two years ago. = He _____ in the army for two years.',options:['A.has joined','B.has been','C.was','D.is'],answer:'B',explanation:'join是非延续性动词，与for连用需换成be in',score:2 },
      { id:'e216',subject:'english',chapter:'现在完成时',section:'现在完成时',knowledgePoint:'recently/lately',type:'choice',difficulty:'hard',question:'He _____ much progress in his English recently.',options:['A.made','B.makes','C.has made','D.was making'],answer:'C',explanation:'recently"最近"是现在完成时的标志词',score:2 },

      // ---- 过去进行时 补充13题(e221-e233) 共15题 ----
      { id:'e221',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'过去进行时基本结构',type:'choice',difficulty:'easy',question:'I _____ a shower when the phone rang.',options:['A.take','B.took','C.was taking','D.were taking'],answer:'C',explanation:'过去某个时间点正在发生的动作，用过去进行时',score:2 },
      { id:'e222',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'at that time',type:'choice',difficulty:'easy',question:'What were you doing at 8:00 last night? I _____ TV.',options:['A.watch','B.watched','C.was watching','D.were watching'],answer:'C',explanation:'过去具体时间点(at 8:00 last night)正在做的事，用过去进行时',score:2 },
      { id:'e223',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'while引导从句',type:'choice',difficulty:'easy',question:'While she _____ dinner, her husband came back.',options:['A.cooks','B.cooked','C.was cooking','D.is cooking'],answer:'C',explanation:'while引导的时间状语从句常用进行时',score:2 },
      { id:'e224',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'过去进行时疑问句',type:'choice',difficulty:'easy',question:'—_____ you _____ at 10 o\'clock yesterday? —No, I wasn\'t.',options:['A.Did;sleep','B.Were;sleeping','C.Are;sleeping','D.Do;sleep'],answer:'B',explanation:'过去时间点问正在做什么，用过去进行时Were you doing...?',score:2 },
      { id:'e225',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'并列动作',type:'choice',difficulty:'medium',question:'My father _____ newspapers while my mother _____ the floor.',options:['A.read;cleaned','B.was reading;was cleaning','C.reads;cleans','D.is reading;is cleaning'],answer:'B',explanation:'while连接两个同时进行的过去动作，都用过去进行时',score:2 },
      { id:'e226',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'when与过去进行时',type:'choice',difficulty:'medium',question:'We _____ a picnic when it suddenly began to rain.',options:['A.have','B.had','C.are having','D.were having'],answer:'D',explanation:'when引导的从句用一般过去时，主句用过去进行时表正在进行的动作',score:2 },
      { id:'e227',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'过去进行时否定句',type:'choice',difficulty:'easy',question:'The children _____ at that time. They were doing homework.',options:['A.didn\'t play','B.weren\'t playing','C.don\'t play','D.aren\'t playing'],answer:'B',explanation:'at that time提示过去进行时，否定用wasn\'t/weren\'t doing',score:2 },
      { id:'e228',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'all morning',type:'choice',difficulty:'medium',question:'It _____ heavily all yesterday morning.',options:['A.rains','B.rained','C.was raining','D.is raining'],answer:'C',explanation:'all yesterday morning"整个昨天上午"强调持续，用过去进行时',score:2 },
      { id:'e229',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'过去进行时与一般过去时',type:'choice',difficulty:'medium',question:'He _____ his bike when a car _____ him.',options:['A.rode;hits','B.was riding;hit','C.rides;hit','D.is riding;hits'],answer:'B',explanation:'过去进行时(长动作)中发生了一般过去时(短动作)',score:2 },
      { id:'e230',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'过去进行时综合',type:'choice',difficulty:'hard',question:'—I called you at 7:00 yesterday evening, but nobody answered. —Oh, I _____ a walk with my dog.',options:['A.took','B.was taking','C.am taking','D.had taken'],answer:'B',explanation:'过去时间点(at 7:00)正在做的事，是打电话时正在进行的动作',score:2 },
      { id:'e231',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'过去进行时表背景',type:'choice',difficulty:'medium',question:'The sun _____ and the birds _____ in the trees. It was a beautiful morning.',options:['A.shone;sang','B.was shining;were singing','C.shines;sing','D.is shining;are singing'],answer:'B',explanation:'用过去进行时描绘过去某一时刻的背景场景',score:2 },
      { id:'e232',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'过去进行时与频率副词',type:'choice',difficulty:'hard',question:'He was always _____ lies when he was young.',options:['A.tell','B.telling','C.told','D.tells'],answer:'B',explanation:'was/were always doing表示过去经常发生且带有感情色彩(厌烦)',score:2 },
      { id:'e233',subject:'english',chapter:'过去进行时',section:'过去进行时',knowledgePoint:'主从句时态搭配',type:'choice',difficulty:'hard',question:'While they _____ along the river, they _____ a strange sound.',options:['A.walked;heard','B.were walking;heard','C.were walking;were hearing','D.walked;were hearing'],answer:'B',explanation:'while从句用进行时(长动作)，主句用一般过去时(短动作)',score:2 },

      // ---- 比较级最高级 补充18题(e236-e253) 共20题 ----
      { id:'e236',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'比较级规则变化',type:'choice',difficulty:'easy',question:'Which is _____, the earth or the moon?',options:['A.small','B.smaller','C.smallest','D.the smaller'],answer:'B',explanation:'两者比较用比较级，small是单音节直接加-er',score:2 },
      { id:'e237',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'多音节比较级',type:'choice',difficulty:'easy',question:'This book is _____ than that one.',options:['A.interesting','B.more interesting','C.most interesting','D.the most interesting'],answer:'B',explanation:'多音节形容词比较级前加more',score:2 },
      { id:'e238',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'as...as',type:'choice',difficulty:'easy',question:'This shirt is _____ that one. They are the same size.',options:['A.as big as','B.bigger than','C.the biggest','D.not as big as'],answer:'A',explanation:'as+原级+as表示"和...一样..."',score:2 },
      { id:'e239',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'not as/so...as',type:'choice',difficulty:'easy',question:'This problem is _____ that one. It\'s much easier.',options:['A.as difficult as','B.not as difficult as','C.more difficult than','D.the most difficult'],answer:'B',explanation:'not as/so+原级+as表示"不如..."',score:2 },
      { id:'e240',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'much修饰比较级',type:'choice',difficulty:'medium',question:'The weather today is much _____ than yesterday.',options:['A.cold','B.colder','C.coldest','D.the coldest'],answer:'B',explanation:'much/far/even/a lot可以修饰比较级加强语气',score:2 },
      { id:'e241',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'比较级特殊变化',type:'choice',difficulty:'medium',question:'His health is getting _____ after the operation.',options:['A.bad','B.worse','C.worst','D.the worst'],answer:'B',explanation:'bad的比较级是worse(不规则变化)',score:2 },
      { id:'e242',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'the+比较级,the+比较级',type:'choice',difficulty:'medium',question:'_____ you work, _____ grades you will get.',options:['A.Harder;better','B.The harder;the better','C.Hard;good','D.More hard;more good'],answer:'B',explanation:'the+比较级,the+比较级表示"越...就越..."',score:2 },
      { id:'e243',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'比较级and比较级',type:'choice',difficulty:'medium',question:'Our city is becoming _____ .',options:['A.beautiful and beautiful','B.more and more beautiful','C.more beautiful and more beautiful','D.beautifuler and beautifuler'],answer:'B',explanation:'多音节形容词用more and more+原级表示"越来越..."',score:2 },
      { id:'e244',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'one of the+最高级',type:'choice',difficulty:'medium',question:'The Yellow River is one of _____ rivers in the world.',options:['A.long','B.longer','C.longest','D.the longest'],answer:'D',explanation:'one of+the+最高级+复数名词"最...之一"',score:2 },
      { id:'e245',subject:'english',chapter:'比较级最高级',section:'形容词最高级',knowledgePoint:'三者比较',type:'choice',difficulty:'easy',question:'Of the three boys, Tom is _____ .',options:['A.tall','B.taller','C.the tallest','D.more tall'],answer:'C',explanation:'三者及以上比较用最高级',score:2 },
      { id:'e246',subject:'english',chapter:'比较级最高级',section:'形容词最高级',knowledgePoint:'序数词+最高级',type:'choice',difficulty:'medium',question:'The Yellow River is the second _____ river in China.',options:['A.long','B.longer','C.longest','D.most long'],answer:'C',explanation:'the+序数词+最高级表示"第几最..."',score:2 },
      { id:'e247',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'比较级选择疑问句',type:'choice',difficulty:'easy',question:'Who is _____, Tom or Mike?',options:['A.tall','B.taller','C.tallest','D.the taller'],answer:'B',explanation:'两者之间的选择疑问句用比较级',score:2 },
      { id:'e248',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'越来越(单音节)',type:'choice',difficulty:'medium',question:'It is getting _____ at night now.',options:['A.cold and cold','B.colder and colder','C.more and more cold','D.coldest and coldest'],answer:'B',explanation:'单音节形容词用比较级+and+比较级表示"越来越..."',score:2 },
      { id:'e249',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'比较级数量表达',type:'choice',difficulty:'medium',question:'My sister is three years _____ than me.',options:['A.old','B.older','C.oldest','D.the oldest'],answer:'B',explanation:'表示"大/小/高...多少"用"数量词+比较级+than"',score:2 },
      { id:'e250',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'比较级修饰词辨析',type:'choice',difficulty:'hard',question:'The number of students in our school is _____ larger than theirs.',options:['A.very','B.quite','C.much','D.too'],answer:'C',explanation:'修饰比较级用much/far/even/a lot，very/quite/too修饰原级',score:2 },
      { id:'e251',subject:'english',chapter:'比较级最高级',section:'形容词最高级',knowledgePoint:'最高级范围表达',type:'choice',difficulty:'medium',question:'Tom is the tallest _____ all the students in his class.',options:['A.in','B.of','C.than','D.from'],answer:'B',explanation:'of all...表示"在所有...之中"，是最高级的范围标志',score:2 },
      { id:'e252',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'比较级的替代用法',type:'choice',difficulty:'hard',question:'I don\'t have _____ money as you, so I can\'t buy that expensive bag.',options:['A.as more','B.as much','C.so more','D.as many'],answer:'B',explanation:'money是不可数名词，as much...as表示"和...一样多"',score:2 },
      { id:'e253',subject:'english',chapter:'比较级最高级',section:'形容词比较级',knowledgePoint:'比较级表最高级含义',type:'choice',difficulty:'hard',question:'Tom is taller than _____ student in his class. = Tom is the tallest in his class.',options:['A.any other','B.any','C.all','D.other'],answer:'A',explanation:'比较级+than any other+单数名词 = 最高级，注意同一范围内比较加other',score:2 },

      // ---- 动词不定式 补充14题(e256-e269) 共15题 ----
      { id:'e256',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'tell sb to do',type:'choice',difficulty:'easy',question:'The teacher told us _____ carefully in class.',options:['A.listen','B.listening','C.to listen','D.listened'],answer:'C',explanation:'tell sb to do sth. 告诉某人做某事',score:2 },
      { id:'e257',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'不定式表目的',type:'choice',difficulty:'easy',question:'He got up early _____ the first bus.',options:['A.catch','B.to catch','C.catching','D.caught'],answer:'B',explanation:'不定式作目的状语"为了..."',score:2 },
      { id:'e258',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'it作形式主语',type:'choice',difficulty:'medium',question:'It\'s important for us _____ English well.',options:['A.learn','B.learning','C.to learn','D.learned'],answer:'C',explanation:'It\'s+adj+for sb+to do sth. 做某事对某人来说...',score:2 },
      { id:'e259',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'decide to do',type:'choice',difficulty:'easy',question:'They decided _____ a new house in the countryside.',options:['A.build','B.building','C.to build','D.built'],answer:'C',explanation:'decide to do sth. 决定做某事',score:2 },
      { id:'e260',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'不定式作宾语补足语',type:'choice',difficulty:'medium',question:'My mother made me _____ the room before going out.',options:['A.clean','B.to clean','C.cleaning','D.cleaned'],answer:'A',explanation:'make/let/have sb do sth. 使役动词后用省略to的不定式',score:2 },
      { id:'e261',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'疑问词+不定式',type:'choice',difficulty:'medium',question:'I don\'t know _____ to the party or not.',options:['A.go','B.going','C.whether to go','D.to go'],answer:'C',explanation:'whether to do"是否做..."，疑问词+不定式作宾语',score:2 },
      { id:'e262',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'too...to',type:'choice',difficulty:'medium',question:'The boy is too young _____ to school by himself.',options:['A.go','B.going','C.to go','D.went'],answer:'C',explanation:'too...to...表示"太...而不能..."，to后接动词原形',score:2 },
      { id:'e263',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'would like to do',type:'choice',difficulty:'easy',question:'Would you like _____ some tea?',options:['A.have','B.to have','C.having','D.had'],answer:'B',explanation:'would like to do sth. 想要做某事',score:2 },
      { id:'e264',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'stop to do/doing',type:'choice',difficulty:'medium',question:'When the teacher came in, the students stopped _____.',options:['A.talk','B.to talk','C.talking','D.talked'],answer:'C',explanation:'stop doing停止正在做的事，stop to do停下来去做另一件事',score:2 },
      { id:'e265',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'不定式作定语',type:'choice',difficulty:'hard',question:'I have a lot of homework _____ tonight.',options:['A.do','B.doing','C.to do','D.done'],answer:'C',explanation:'不定式作后置定语修饰名词"要做..."',score:2 },
      { id:'e266',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'enough to do',type:'choice',difficulty:'medium',question:'She is old enough _____ by herself.',options:['A.eat','B.to eat','C.eating','D.ate'],answer:'B',explanation:'...enough to do sth. 足够...可以做某事',score:2 },
      { id:'e267',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'remember to do/doing',type:'choice',difficulty:'hard',question:'Please remember _____ the windows before leaving.',options:['A.close','B.to close','C.closing','D.closed'],answer:'B',explanation:'remember to do记得要做(未做)，remember doing记得做过(已做)',score:2 },
      { id:'e268',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'感官动词+do/doing',type:'choice',difficulty:'medium',question:'I saw him _____ into the classroom just now.',options:['A.go','B.to go','C.went','D.gone'],answer:'A',explanation:'感官动词see/watch/hear sb do sth. 看到某人做了某事(全过程)',score:2 },
      { id:'e269',subject:'english',chapter:'动词不定式',section:'非谓语动词',knowledgePoint:'不定式综合辨析',type:'choice',difficulty:'hard',question:'He seemed _____ the bad news already.',options:['A.know','B.knowing','C.to know','D.knew'],answer:'C',explanation:'seem to do sth. 似乎做某事',score:2 },

      // ---- 连词unless/as soon as/so that 补充14题(e271-e284) 共15题 ----
      { id:'e271',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'as soon as',type:'choice',difficulty:'easy',question:'I will tell him the news _____ he comes back.',options:['A.as soon as','B.until','C.unless','D.because'],answer:'A',explanation:'as soon as"一...就..."，引导时间状语从句',score:2 },
      { id:'e272',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'unless基本用法',type:'choice',difficulty:'easy',question:'You won\'t succeed _____ you work harder.',options:['A.if','B.unless','C.when','D.because'],answer:'B',explanation:'unless=if...not"除非/如果不"，引导条件状语从句',score:2 },
      { id:'e273',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'so that目的',type:'choice',difficulty:'easy',question:'He got up early _____ he could catch the early bus.',options:['A.so that','B.unless','C.although','D.as soon as'],answer:'A',explanation:'so that"以便、为了"，引导目的状语从句',score:2 },
      { id:'e274',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'as soon as时态',type:'choice',difficulty:'medium',question:'I _____ you an e-mail as soon as I _____ in London.',options:['A.send;arrive','B.will send;will arrive','C.will send;arrive','D.send;will arrive'],answer:'C',explanation:'as soon as引导的从句用一般现在时表将来，主句用一般将来时',score:2 },
      { id:'e275',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'unless时态',type:'choice',difficulty:'medium',question:'We will go for a picnic unless it _____ tomorrow.',options:['A.will rain','B.rains','C.rained','D.is raining'],answer:'B',explanation:'unless引导的条件状语从句用一般现在时表将来',score:2 },
      { id:'e276',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'so...that',type:'choice',difficulty:'easy',question:'The box is _____ heavy _____ I can\'t carry it.',options:['A.so;that','B.such;that','C.too;to','D.enough;to'],answer:'A',explanation:'so+adj/adv+that从句表示"如此...以至于..."',score:2 },
      { id:'e277',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'such...that',type:'choice',difficulty:'medium',question:'She is _____ a kind girl _____ everyone likes her.',options:['A.so;that','B.such;that','C.too;to','D.enough;that'],answer:'B',explanation:'such+a/an+adj+n+that从句"如此...以至于..."',score:2 },
      { id:'e278',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'so that与in order to转换',type:'choice',difficulty:'medium',question:'He ran fast so that he could catch the bus. = He ran fast _____ catch the bus.',options:['A.so that','B.in order to','C.because','D.unless'],answer:'B',explanation:'so that+从句 = in order to+动词原形 "为了"',score:2 },
      { id:'e279',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'unless与if...not互换',type:'choice',difficulty:'medium',question:'Unless you study hard, you will fail the exam. = _____ you _____ study hard, you will fail the exam.',options:['A.If;don\'t','B.If;will','C.When;don\'t','D.Because;don\'t'],answer:'A',explanation:'Unless = If...not',score:2 },
      { id:'e280',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'so...that与too...to转换',type:'choice',difficulty:'hard',question:'He was so excited that he couldn\'t say a word. = He was _____ excited _____ say a word.',options:['A.very;to','B.too;to','C.so;that','D.such;that'],answer:'B',explanation:'so...that...can\'t = too...to... "太...而不能..."',score:2 },
      { id:'e281',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'as soon as综合',type:'choice',difficulty:'medium',question:'_____ the bell rang, the students rushed out of the classroom.',options:['A.As soon as','B.Unless','C.Although','D.So that'],answer:'A',explanation:'as soon as表示"一...就..."，连接两个紧接着发生的动作',score:2 },
      { id:'e282',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'so that结果',type:'choice',difficulty:'medium',question:'He was caught in the rain, _____ he had a bad cold.',options:['A.so that','B.unless','C.as soon as','D.until'],answer:'A',explanation:'so that也可引导结果状语从句"结果..."',score:2 },
      { id:'e283',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'so...that与such...that辨析',type:'choice',difficulty:'hard',question:'He made _____ rapid progress _____ the teacher praised him.',options:['A.so;that','B.such;that','C.too;to','D.enough;to'],answer:'B',explanation:'progress是不可数名词，such+adj+不可数名词+that',score:2 },
      { id:'e284',subject:'english',chapter:'连词',section:'连词',knowledgePoint:'连词综合辨析',type:'choice',difficulty:'hard',question:'_____ he is very old, _____ he still keeps exercising every day.',options:['A.Although;/','B.Although;but','C.Because;so','D.Unless;then'],answer:'A',explanation:'although不与but连用，这是英文习惯表达',score:2 },

      // ---- 情态动词should/could 补充14题(e286-e299) 共15题 ----
      { id:'e286',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'should提建议',type:'choice',difficulty:'easy',question:'You look tired. You _____ go to bed early tonight.',options:['A.should','B.could','C.would','D.might'],answer:'A',explanation:'should表示建议"应该"，语气比could更强',score:2 },
      { id:'e287',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'could表请求',type:'choice',difficulty:'easy',question:'_____ you please help me with this heavy box?',options:['A.Should','B.Could','C.Must','D.Need'],answer:'B',explanation:'Could you please do...? 是礼貌请求的常用句型',score:2 },
      { id:'e288',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'could表能力(过去)',type:'choice',difficulty:'easy',question:'When I was young, I _____ run very fast.',options:['A.should','B.could','C.must','D.need'],answer:'B',explanation:'could表示过去的能力"能、会"',score:2 },
      { id:'e289',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'should have done',type:'choice',difficulty:'hard',question:'You _____ have told me earlier. I could have helped you.',options:['A.should','B.could','C.must','D.need'],answer:'A',explanation:'should have done表示"本应该做(而没做)"',score:2 },
      { id:'e290',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'shouldn\'t',type:'choice',difficulty:'easy',question:'You _____ eat too much junk food. It\'s bad for your health.',options:['A.should','B.shouldn\'t','C.could','D.couldn\'t'],answer:'B',explanation:'shouldn\'t表示建议"不应该"',score:2 },
      { id:'e291',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'could的可能性',type:'choice',difficulty:'medium',question:'—Where is John? —He _____ be in the library. I\'m not sure.',options:['A.must','B.should','C.could','D.need'],answer:'C',explanation:'could表示可能性"可能"(把握不大，不太确定)',score:2 },
      { id:'e292',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'should表推测',type:'choice',difficulty:'medium',question:'The bus _____ be here soon. It\'s already 8:30.',options:['A.could','B.should','C.can','D.would'],answer:'B',explanation:'should表示按常理推测"应该"',score:2 },
      { id:'e293',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'Could you...回答',type:'choice',difficulty:'medium',question:'—Could I use your phone? —Yes, of course you _____.',options:['A.could','B.should','C.can','D.must'],answer:'C',explanation:'Could I...?/Could you...? 表请求时，肯定回答用can不用could',score:2 },
      { id:'e294',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'should表义务',type:'choice',difficulty:'medium',question:'As students, we _____ obey the school rules.',options:['A.could','B.should','C.would','D.might'],answer:'B',explanation:'should表示责任和义务"应该"',score:2 },
      { id:'e295',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'could have done',type:'choice',difficulty:'hard',question:'You _____ have passed the exam if you had studied harder.',options:['A.should','B.could','C.must','D.need'],answer:'B',explanation:'could have done表示"本来能做(但没做)"，虚拟语气',score:2 },
      { id:'e296',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'Why not/Why don\'t you',type:'choice',difficulty:'medium',question:'—Why don\'t you _____ for a walk with us? —Good idea.',options:['A.go','B.to go','C.going','D.went'],answer:'A',explanation:'Why don\'t you+动词原形?=Why not+动词原形? "为什么不...?"',score:2 },
      { id:'e297',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'should征求意见',type:'choice',difficulty:'medium',question:'—What _____ I do if I feel stressed? —You can listen to music.',options:['A.should','B.could','C.would','D.might'],answer:'A',explanation:'What should I do? 用于征求意见"我应该做什么?"',score:2 },
      { id:'e298',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'should与must辨析',type:'choice',difficulty:'hard',question:'You _____ finish the work today. It\'s not very urgent.',options:['A.must','B.have to','C.should','D.need to'],answer:'C',explanation:'should表建议(非强制)，must/have to表必须(强制)',score:2 },
      { id:'e299',subject:'english',chapter:'情态动词',section:'情态动词',knowledgePoint:'Could you possibly',type:'choice',difficulty:'medium',question:'Could you _____ tell me the way to the station?',options:['A.possibly','B.probably','C.really','D.certainly'],answer:'A',explanation:'Could you possibly...? 是更加委婉礼貌的请求方式',score:2 },
    ],

    // ==================== 九年级预习（40题）====================
    preview: [
      // ---- 被动语态 (10题: easy4/medium4/hard2) ----
      { id:'e301',subject:'english',chapter:'被动语态',section:'被动语态',knowledgePoint:'一般现在时被动',type:'choice',difficulty:'easy',question:'English _____ all over the world.',options:['A.speaks','B.is spoken','C.spoke','D.is speaking'],answer:'B',explanation:'一般现在时被动：am/is/are+过去分词，English与speak是被动关系',score:2 },
      { id:'e302',subject:'english',chapter:'被动语态',section:'被动语态',knowledgePoint:'一般过去时被动',type:'choice',difficulty:'easy',question:'The bridge _____ in 2010.',options:['A.was built','B.is built','C.built','D.builds'],answer:'A',explanation:'一般过去时被动：was/were+过去分词',score:2 },
      { id:'e303',subject:'english',chapter:'被动语态',section:'被动语态',knowledgePoint:'含情态动词的被动',type:'choice',difficulty:'medium',question:'The work must _____ before Friday.',options:['A.finish','B.be finished','C.finished','D.is finished'],answer:'B',explanation:'情态动词被动：情态动词+be+过去分词',score:2 },
      { id:'e304',subject:'english',chapter:'被动语态',section:'被动语态',knowledgePoint:'一般将来时被动',type:'choice',difficulty:'medium',question:'A new hospital _____ in our city next year.',options:['A.will build','B.will be built','C.is built','D.was built'],answer:'B',explanation:'一般将来时被动：will+be+过去分词',score:2 },
      { id:'e305',subject:'english',chapter:'被动语态',section:'被动语态',knowledgePoint:'现在完成时被动',type:'choice',difficulty:'medium',question:'The work _____ already _____ by the workers.',options:['A.is;finished','B.was;finished','C.has;been finished','D.have;finished'],answer:'C',explanation:'现在完成时被动：have/has+been+过去分词',score:2 },
      { id:'e306',subject:'english',chapter:'被动语态',section:'被动语态',knowledgePoint:'主动变被动',type:'choice',difficulty:'easy',question:'They grow rice in the south. = Rice _____ in the south.',options:['A.grows','B.is grown','C.grew','D.was grown'],answer:'B',explanation:'主动语态变被动：宾语变主语，谓语变be+过去分词',score:2 },
      { id:'e307',subject:'english',chapter:'被动语态',section:'被动语态',knowledgePoint:'双宾语被动',type:'choice',difficulty:'hard',question:'He gave me a book. → I _____ a book by him.',options:['A.gave','B.was given','C.have given','D.am giving'],answer:'B',explanation:'双宾语变被动可用间接宾语作主语，保留直接宾语',score:2 },
      { id:'e308',subject:'english',chapter:'被动语态',section:'被动语态',knowledgePoint:'不及物动词无被动',type:'choice',difficulty:'medium',question:'Great changes _____ in my hometown these years.',options:['A.have taken place','B.have been taken place','C.took place','D.were taken place'],answer:'A',explanation:'take place"发生"是不及物动词短语，没有被动语态',score:2 },
      { id:'e309',subject:'english',chapter:'被动语态',section:'被动语态',knowledgePoint:'被动语态by短语',type:'choice',difficulty:'easy',question:'This song was written _____ Jay Chou.',options:['A.with','B.by','C.to','D.for'],answer:'B',explanation:'被动语态中引出动作执行者用by',score:2 },
      { id:'e310',subject:'english',chapter:'被动语态',section:'被动语态',knowledgePoint:'被动语态特殊结构',type:'choice',difficulty:'hard',question:'The old man needs _____ after well.',options:['A.to look','B.looking','C.looked','D.to be looked'],answer:'D',explanation:'need to be done = need doing "需要被..."，但选项有to be looked是正确形式',score:2 },

      // ---- 定语从句 (10题: easy4/medium4/hard2) ----
      { id:'e311',subject:'english',chapter:'定语从句',section:'定语从句',knowledgePoint:'who引导的定语从句',type:'choice',difficulty:'easy',question:'The boy _____ is playing basketball is my brother.',options:['A.who','B.which','C.what','D.whom'],answer:'A',explanation:'先行词the boy指人，关系代词用who作主语',score:2 },
      { id:'e312',subject:'english',chapter:'定语从句',section:'定语从句',knowledgePoint:'which引导的定语从句',type:'choice',difficulty:'easy',question:'The book _____ I bought yesterday is very interesting.',options:['A.who','B.which','C.what','D.whom'],answer:'B',explanation:'先行词the book指物，关系代词用which',score:2 },
      { id:'e313',subject:'english',chapter:'定语从句',section:'定语从句',knowledgePoint:'that引导的定语从句',type:'choice',difficulty:'easy',question:'This is the best movie _____ I have ever seen.',options:['A.who','B.which','C.that','D.what'],answer:'C',explanation:'先行词被最高级修饰时，关系代词只能用that',score:2 },
      { id:'e314',subject:'english',chapter:'定语从句',section:'定语从句',knowledgePoint:'whose引导的定语从句',type:'choice',difficulty:'medium',question:'I know the girl _____ mother is a doctor.',options:['A.who','B.which','C.whose','D.whom'],answer:'C',explanation:'whose在定语从句中作定语，表示"某人的"',score:2 },
      { id:'e315',subject:'english',chapter:'定语从句',section:'定语从句',knowledgePoint:'whom引导的定语从句',type:'choice',difficulty:'medium',question:'The man with _____ I talked just now is my teacher.',options:['A.who','B.which','C.whom','D.whose'],answer:'C',explanation:'whom在定语从句中作宾语，with whom作介词的宾语',score:2 },
      { id:'e316',subject:'english',chapter:'定语从句',section:'定语从句',knowledgePoint:'关系副词when',type:'choice',difficulty:'medium',question:'I will never forget the day _____ we first met.',options:['A.when','B.where','C.which','D.who'],answer:'A',explanation:'先行词the day表时间，用关系副词when',score:2 },
      { id:'e317',subject:'english',chapter:'定语从句',section:'定语从句',knowledgePoint:'关系副词where',type:'choice',difficulty:'medium',question:'This is the school _____ I studied three years ago.',options:['A.when','B.where','C.which','D.that'],answer:'B',explanation:'先行词the school表地点，用关系副词where',score:2 },
      { id:'e318',subject:'english',chapter:'定语从句',section:'定语从句',knowledgePoint:'只能用that的情况',type:'choice',difficulty:'hard',question:'All _____ can be done has been done.',options:['A.which','B.that','C.what','D.who'],answer:'B',explanation:'先行词是all/anything/nothing等不定代词时，只能用that',score:2 },
      { id:'e319',subject:'english',chapter:'定语从句',section:'定语从句',knowledgePoint:'定语从句主谓一致',type:'choice',difficulty:'hard',question:'She is one of the girls who _____ good at dancing.',options:['A.is','B.are','C.was','D.has been'],answer:'B',explanation:'who指代the girls(复数)，定语从句谓语用复数',score:2 },
      { id:'e320',subject:'english',chapter:'定语从句',section:'定语从句',knowledgePoint:'关系代词省略',type:'choice',difficulty:'easy',question:'The pen (_____) I bought yesterday writes smoothly.',options:['A.who','B.which','C.what','D.whose'],answer:'B',explanation:'关系代词which/that在从句中作宾语时可省略',score:2 },

      // ---- 宾语从句 (10题: easy4/medium4/hard2) ----
      { id:'e321',subject:'english',chapter:'宾语从句',section:'宾语从句',knowledgePoint:'that引导的宾语从句',type:'choice',difficulty:'easy',question:'I think _____ he is an honest boy.',options:['A.that','B.if','C.whether','D.what'],answer:'A',explanation:'陈述句作宾语从句用that引导(that可省略)',score:2 },
      { id:'e322',subject:'english',chapter:'宾语从句',section:'宾语从句',knowledgePoint:'if/whether引导',type:'choice',difficulty:'easy',question:'I don\'t know _____ he will come tomorrow.',options:['A.that','B.if','C.what','D.which'],answer:'B',explanation:'一般疑问句变宾语从句用if/whether引导"是否"',score:2 },
      { id:'e323',subject:'english',chapter:'宾语从句',section:'宾语从句',knowledgePoint:'宾语从句语序',type:'choice',difficulty:'medium',question:'Can you tell me _____?',options:['A.where does he live','B.where he lives','C.where he live','D.where is he living'],answer:'B',explanation:'宾语从句必须用陈述语序：连接词+主语+谓语',score:2 },
      { id:'e324',subject:'english',chapter:'宾语从句',section:'宾语从句',knowledgePoint:'宾语从句时态',type:'choice',difficulty:'medium',question:'He said that he _____ to Beijing the next week.',options:['A.will go','B.would go','C.goes','D.is going'],answer:'B',explanation:'主句用过去时(said)，从句要用对应的过去时(would go)',score:2 },
      { id:'e325',subject:'english',chapter:'宾语从句',section:'宾语从句',knowledgePoint:'what引导宾语从句',type:'choice',difficulty:'medium',question:'I don\'t understand _____ you are talking about.',options:['A.that','B.if','C.what','D.which'],answer:'C',explanation:'what在宾语从句中作宾语"什么"',score:2 },
      { id:'e326',subject:'english',chapter:'宾语从句',section:'宾语从句',knowledgePoint:'whether与if区别',type:'choice',difficulty:'medium',question:'I\'m thinking about _____ I should go or not.',options:['A.if','B.whether','C.that','D.what'],answer:'B',explanation:'与or not连用或在介词后只能用whether不能用if',score:2 },
      { id:'e327',subject:'english',chapter:'宾语从句',section:'宾语从句',knowledgePoint:'宾语从句客观真理',type:'choice',difficulty:'easy',question:'The teacher told us that the moon _____ around the earth.',options:['A.moved','B.moves','C.was moving','D.had moved'],answer:'B',explanation:'宾语从句表述客观真理时，即使主句是过去时，从句仍用一般现在时',score:2 },
      { id:'e328',subject:'english',chapter:'宾语从句',section:'宾语从句',knowledgePoint:'疑问词+不定式',type:'choice',difficulty:'easy',question:'I don\'t know _____ to do next.',options:['A.how','B.what','C.why','D.when'],answer:'B',explanation:'what to do"做什么"，what是疑问代词作to do的宾语',score:2 },
      { id:'e329',subject:'english',chapter:'宾语从句',section:'宾语从句',knowledgePoint:'宾语从句否定转移',type:'choice',difficulty:'hard',question:'I _____ think he _____ right.',options:['A.don\'t;is','B.don\'t;isn\'t','C.am not;is','D.not;not'],answer:'A',explanation:'think/believe/suppose的宾语从句否定前移到主句',score:2 },
      { id:'e330',subject:'english',chapter:'宾语从句',section:'宾语从句',knowledgePoint:'宾语从句综合',type:'choice',difficulty:'hard',question:'—Could you tell me _____? —In two days.',options:['A.how soon he will come back','B.how long he will stay','C.when will he come','D.where he goes'],answer:'A',explanation:'how soon"多久以后"(与in+时间段搭配)，语序为陈述语序',score:2 },

      // ---- 虚拟语气基础 (10题: easy4/medium4/hard2) ----
      { id:'e331',subject:'english',chapter:'虚拟语气',section:'虚拟语气',knowledgePoint:'if虚拟条件句(与现在)',type:'choice',difficulty:'easy',question:'If I _____ you, I would study harder.',options:['A.am','B.was','C.were','D.be'],answer:'C',explanation:'与现在事实相反的虚拟语气，be动词一律用were',score:2 },
      { id:'e332',subject:'english',chapter:'虚拟语气',section:'虚拟语气',knowledgePoint:'I wish句型',type:'choice',difficulty:'easy',question:'I wish I _____ a bird and could fly in the sky.',options:['A.am','B.was','C.were','D.be'],answer:'C',explanation:'wish后接虚拟语气，与现在事实相反be动词用were',score:2 },
      { id:'e333',subject:'english',chapter:'虚拟语气',section:'虚拟语气',knowledgePoint:'if虚拟(与现在相反)',type:'choice',difficulty:'medium',question:'If I had enough money, I _____ a new car.',options:['A.buy','B.will buy','C.would buy','D.bought'],answer:'C',explanation:'与现在相反：从句用过去时，主句用would+动词原形',score:2 },
      { id:'e334',subject:'english',chapter:'虚拟语气',section:'虚拟语气',knowledgePoint:'suggest表建议',type:'choice',difficulty:'medium',question:'I suggest that he _____ a rest at once.',options:['A.takes','B.took','C.take','D.taking'],answer:'C',explanation:'suggest/insist/order等词后的that从句用(should)+动词原形',score:2 },
      { id:'e335',subject:'english',chapter:'虚拟语气',section:'虚拟语气',knowledgePoint:'if虚拟(与过去相反)',type:'choice',difficulty:'medium',question:'If I had known the truth, I _____ you earlier.',options:['A.told','B.would tell','C.had told','D.would have told'],answer:'D',explanation:'与过去事实相反：从句用had done，主句用would have done',score:2 },
      { id:'e336',subject:'english',chapter:'虚拟语气',section:'虚拟语气',knowledgePoint:'if虚拟(与将来相反)',type:'choice',difficulty:'medium',question:'If it _____ tomorrow, we would stay at home.',options:['A.snows','B.snowed','C.will snow','D.would snow'],answer:'B',explanation:'与将来事实相反：从句用过去时或should/were to do',score:2 },
      { id:'e337',subject:'english',chapter:'虚拟语气',section:'虚拟语气',knowledgePoint:'as if/though',type:'choice',difficulty:'hard',question:'He talks as if he _____ everything about the world.',options:['A.knows','B.knew','C.has known','D.will know'],answer:'B',explanation:'as if/as though引导的从句常用虚拟语气表示与事实相反',score:2 },
      { id:'e338',subject:'english',chapter:'虚拟语气',section:'虚拟语气',knowledgePoint:'It\'s time句型',type:'choice',difficulty:'easy',question:'It\'s time that we _____ home. It\'s getting dark.',options:['A.go','B.went','C.will go','D.are going'],answer:'B',explanation:'It\'s (high) time (that)...句型从句用过去时表虚拟',score:2 },
      { id:'e339',subject:'english',chapter:'虚拟语气',section:'虚拟语气',knowledgePoint:'would rather',type:'choice',difficulty:'hard',question:'I would rather you _____ here tomorrow morning.',options:['A.come','B.will come','C.came','D.would come'],answer:'C',explanation:'would rather后接从句用过去时表虚拟(与现在/将来相反)',score:2 },
      { id:'e340',subject:'english',chapter:'虚拟语气',section:'虚拟语气',knowledgePoint:'虚拟语气倒装',type:'choice',difficulty:'easy',question:'_____ I you, I would accept the offer.',options:['A.Am','B.Was','C.Were','D.Be'],answer:'C',explanation:'If I were you的倒装省略形式：Were I you... (省略if，were提前)',score:2 },
    ],

    // ==================== 阅读理解（15题：5篇短文×3题）====================
    reading: [
      // ---- Passage 1: 日常生活 ----
      { id:'e401',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'细节理解',type:'choice',difficulty:'easy',question:'Passage:\nTom is a 14-year-old middle school student. He gets up at 6:30 every morning and goes to school by bike. His school is about 2 kilometers away from his home. He has four classes in the morning and two in the afternoon. His favorite subject is English because he thinks it is interesting. After school, he often plays basketball with his friends. He goes home at 5:30 and does his homework after dinner.\n\nQuestion: How does Tom go to school?',options:['A.By bus','B.By bike','C.On foot','D.By car'],answer:'B',explanation:'文中明确提到"goes to school by bike"',score:2 },
      { id:'e402',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'细节理解',type:'choice',difficulty:'easy',question:'Passage:\nTom is a 14-year-old middle school student. He gets up at 6:30 every morning and goes to school by bike. His school is about 2 kilometers away from his home. He has four classes in the morning and two in the afternoon. His favorite subject is English because he thinks it is interesting. After school, he often plays basketball with his friends. He goes home at 5:30 and does his homework after dinner.\n\nQuestion: Why does Tom like English best?',options:['A.Because it\'s easy','B.Because the teacher is nice','C.Because he thinks it\'s interesting','D.Because he wants to travel abroad'],answer:'C',explanation:'文中说"because he thinks it is interesting"',score:2 },
      { id:'e403',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'推理判断',type:'choice',difficulty:'medium',question:'Passage:\nTom is a 14-year-old middle school student. He gets up at 6:30 every morning and goes to school by bike. His school is about 2 kilometers away from his home. He has four classes in the morning and two in the afternoon. His favorite subject is English because he thinks it is interesting. After school, he often plays basketball with his friends. He goes home at 5:30 and does his homework after dinner.\n\nQuestion: How many classes does Tom have each day?',options:['A.Four','B.Two','C.Six','D.Eight'],answer:'C',explanation:'上午4节+下午2节=6节课',score:2 },

      // ---- Passage 2: 科普知识 ----
      { id:'e404',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'细节理解',type:'choice',difficulty:'easy',question:'Passage:\nPlants are very important to humans. They give us food, such as rice, wheat, fruits, and vegetables. Plants also produce oxygen that we need to breathe. Without plants, there would be no life on Earth. However, many people cut down trees and destroy forests. This is bad for the environment. We should plant more trees and protect the forests.\n\nQuestion: What do plants NOT give us according to the passage?',options:['A.Food','B.Oxygen','C.Water','D.Fruits'],answer:'C',explanation:'文中提到plants provide food and oxygen，未提到water',score:2 },
      { id:'e405',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'词义猜测',type:'choice',difficulty:'medium',question:'Passage:\nPlants are very important to humans. They give us food, such as rice, wheat, fruits, and vegetables. Plants also produce oxygen that we need to breathe. Without plants, there would be no life on Earth. However, many people cut down trees and destroy forests. This is bad for the environment. We should plant more trees and protect the forests.\n\nQuestion: The underlined word "destroy" probably means _____.',options:['A.保护','B.破坏','C.种植','D.喜爱'],answer:'B',explanation:'destroy意为"破坏"，与protect意思相反',score:2 },
      { id:'e406',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'主旨大意',type:'choice',difficulty:'medium',question:'Passage:\nPlants are very important to humans. They give us food, such as rice, wheat, fruits, and vegetables. Plants also produce oxygen that we need to breathe. Without plants, there would be no life on Earth. However, many people cut down trees and destroy forests. This is bad for the environment. We should plant more trees and protect the forests.\n\nQuestion: What is the main idea of this passage?',options:['A.Plants are beautiful','B.We need more food','C.Plants are important and we should protect them','D.Trees can produce oxygen'],answer:'C',explanation:'全文主旨：植物很重要，我们应保护它们',score:2 },

      // ---- Passage 3: 人物故事 ----
      { id:'e407',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'细节理解',type:'choice',difficulty:'easy',question:'Passage:\nHelen Keller was a famous American writer. She became deaf and blind when she was only 19 months old. With the help of her teacher Anne Sullivan, Helen learned to read, write, and speak. She went to college and graduated with honors. Later, she wrote many books about her life and experiences. Her story has encouraged millions of people around the world.\n\nQuestion: What happened to Helen Keller when she was 19 months old?',options:['A.She became a writer','B.She met her teacher','C.She went to college','D.She became deaf and blind'],answer:'D',explanation:'文中提到"She became deaf and blind when she was only 19 months old"',score:2 },
      { id:'e408',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'推理判断',type:'choice',difficulty:'medium',question:'Passage:\nHelen Keller was a famous American writer. She became deaf and blind when she was only 19 months old. With the help of her teacher Anne Sullivan, Helen learned to read, write, and speak. She went to college and graduated with honors. Later, she wrote many books about her life and experiences. Her story has encouraged millions of people around the world.\n\nQuestion: Who helped Helen Keller learn to read and write?',options:['A.Her mother','B.Anne Sullivan','C.Her friend','D.A doctor'],answer:'B',explanation:'文中说"With the help of her teacher Anne Sullivan"',score:2 },
      { id:'e409',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'推理判断',type:'choice',difficulty:'hard',question:'Passage:\nHelen Keller was a famous American writer. She became deaf and blind when she was only 19 months old. With the help of her teacher Anne Sullivan, Helen learned to read, write, and speak. She went to college and graduated with honors. Later, she wrote many books about her life and experiences. Her story has encouraged millions of people around the world.\n\nQuestion: What can we learn from Helen Keller\'s story?',options:['A.College life is easy','B.Teachers are always right','C.We should never give up in the face of difficulties','D.Books are important'],answer:'C',explanation:'Helen Keller的故事告诉我们面对困难永不放弃',score:2 },

      // ---- Passage 4: 环境保护 ----
      { id:'e410',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'细节理解',type:'choice',difficulty:'easy',question:'Passage:\nWater is the source of life. About 70% of the Earth\'s surface is covered with water, but only 3% of it is fresh water that we can drink. Many places in the world are facing serious water shortages. To save water, we can take shorter showers, turn off the tap while brushing teeth, and reuse water when possible. Everyone should play a part in saving water.\n\nQuestion: What percentage of the Earth\'s surface is covered with water?',options:['A.About 3%','B.About 30%','C.About 70%','D.About 97%'],answer:'C',explanation:'文中明确说"About 70% of the Earth\'s surface is covered with water"',score:2 },
      { id:'e411',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'细节理解',type:'choice',difficulty:'medium',question:'Passage:\nWater is the source of life. About 70% of the Earth\'s surface is covered with water, but only 3% of it is fresh water that we can drink. Many places in the world are facing serious water shortages. To save water, we can take shorter showers, turn off the tap while brushing teeth, and reuse water when possible. Everyone should play a part in saving water.\n\nQuestion: Which is NOT mentioned as a way to save water?',options:['A.Taking shorter showers','B.Turning off the tap','C.Drinking less water','D.Reusing water'],answer:'C',explanation:'文中提到的节水方法有缩短淋浴、关水龙头、循环用水，没有说少喝水',score:2 },
      { id:'e412',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'主旨大意',type:'choice',difficulty:'medium',question:'Passage:\nWater is the source of life. About 70% of the Earth\'s surface is covered with water, but only 3% of it is fresh water that we can drink. Many places in the world are facing serious water shortages. To save water, we can take shorter showers, turn off the tap while brushing teeth, and reuse water when possible. Everyone should play a part in saving water.\n\nQuestion: What does the passage mainly talk about?',options:['A.How to drink water','B.The importance of saving water','C.The Earth\'s size','D.Different kinds of water'],answer:'B',explanation:'文章主要讲节水的重要性和方法',score:2 },

      // ---- Passage 5: 文化差异 ----
      { id:'e413',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'细节理解',type:'choice',difficulty:'easy',question:'Passage:\nIn different countries, people have different ways of greeting each other. In China, people often shake hands or nod heads when they meet. In Japan, people bow to show respect. In France, people kiss each other on the cheek when meeting friends. In Thailand, people put their hands together and bow slightly. It is important to learn these customs when you travel abroad.\n\nQuestion: How do people in Japan usually greet each other?',options:['A.Shake hands','B.Kiss on the cheek','C.Nod heads','D.Bow'],answer:'D',explanation:'文中说"In Japan, people bow to show respect"',score:2 },
      { id:'e414',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'细节理解',type:'choice',difficulty:'medium',question:'Passage:\nIn different countries, people have different ways of greeting each other. In China, people often shake hands or nod heads when they meet. In Japan, people bow to show respect. In France, people kiss each other on the cheek when meeting friends. In Thailand, people put their hands together and bow slightly. It is important to learn these customs when you travel abroad.\n\nQuestion: In which country do people greet by kissing on the cheek?',options:['A.China','B.Japan','C.France','D.Thailand'],answer:'C',explanation:'文中提到"In France, people kiss each other on the cheek"',score:2 },
      { id:'e415',subject:'english',chapter:'阅读理解',section:'阅读理解',knowledgePoint:'推理判断',type:'choice',difficulty:'hard',question:'Passage:\nIn different countries, people have different ways of greeting each other. In China, people often shake hands or nod heads when they meet. In Japan, people bow to show respect. In France, people kiss each other on the cheek when meeting friends. In Thailand, people put their hands together and bow slightly. It is important to learn these customs when you travel abroad.\n\nQuestion: Why is it important to learn greeting customs?',options:['A.To become famous','B.To avoid misunderstanding and show respect','C.To learn languages faster','D.To make more money'],answer:'B',explanation:'了解问候习俗有助于避免误解并表示尊重',score:2 },
    ],

    // ==================== 完形填空（15题：5篇短文×3空）====================
    cloze: [
      // ---- Passage 1 ----
      { id:'e501',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'上下文理解',type:'choice',difficulty:'easy',question:'Passage:\nA farmer had a beautiful horse. One day, the horse ran ___1___. His neighbors came to say, "What bad luck!" The farmer said, "Maybe." The next day, the horse came back ___2___ seven wild horses. The neighbors said, "What good luck!" The farmer said, "Maybe."\n\n1. Choose the best word:',options:['A.away','B.off','C.over','D.into'],answer:'A',explanation:'run away"跑走/逃走"，是固定搭配',score:2 },
      { id:'e502',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'固定搭配',type:'choice',difficulty:'easy',question:'Passage:\nA farmer had a beautiful horse. One day, the horse ran ___1___. His neighbors came to say, "What bad luck!" The farmer said, "Maybe." The next day, the horse came back ___2___ seven wild horses. The neighbors said, "What good luck!" The farmer said, "Maybe."\n\n2. Choose the best word:',options:['A.by','B.with','C.for','D.through'],answer:'B',explanation:'come back with..."带着...回来"',score:2 },
      { id:'e503',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'主旨理解',type:'choice',difficulty:'medium',question:'Passage:\nA farmer had a beautiful horse. One day, the horse ran ___1___. His neighbors came to say, "What bad luck!" The farmer said, "Maybe." The next day, the horse came back ___2___ seven wild horses. The neighbors said, "What good luck!" The farmer said, "Maybe."\n\nWhat does the farmer\'s answer "Maybe" suggest?',options:['A.He doesn\'t care','B.Things may not be as good or bad as they seem','C.He is angry','D.He is very happy'],answer:'B',explanation:'农夫的故事寓意：塞翁失马，焉知非福',score:2 },

      // ---- Passage 2 ----
      { id:'e504',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'动词辨析',type:'choice',difficulty:'easy',question:'Passage:\nLast Sunday, my family and I went to the beach. We ___1___ early in the morning and drove for two hours. When we arrived, the sun was shining brightly. My sister and I ___2___ in the water while our parents sat under an umbrella. We had a wonderful time there.\n\n1. Choose the best word:',options:['A.got up','B.put up','C.took up','D.gave up'],answer:'A',explanation:'get up"起床"，符合语境"一大早起床出发"',score:2 },
      { id:'e505',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'动词短语',type:'choice',difficulty:'easy',question:'Passage:\nLast Sunday, my family and I went to the beach. We ___1___ early in the morning and drove for two hours. When we arrived, the sun was shining brightly. My sister and I ___2___ in the water while our parents sat under an umbrella. We had a wonderful time there.\n\n2. Choose the best word:',options:['A.played','B.studied','C.worked','D.slept'],answer:'A',explanation:'play in the water"在水里玩耍"，符合海滩场景',score:2 },
      { id:'e506',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'形容词辨析',type:'choice',difficulty:'medium',question:'Passage:\nLast Sunday, my family and I went to the beach. We ___1___ early in the morning and drove for two hours. When we arrived, the sun was shining brightly. My sister and I ___2___ in the water while our parents sat under an umbrella. We had a wonderful time there.\n\nWhich word best describes the family\'s feeling about the trip?',options:['A.Terrible','B.Boring','C.Wonderful','D.Tiring'],answer:'C',explanation:'文中最后说"We had a wonderful time"',score:2 },

      // ---- Passage 3 ----
      { id:'e507',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'连词辨析',type:'choice',difficulty:'medium',question:'Passage:\nI love reading books ___1___ they open a new world for me. Every weekend, I go to the library to borrow books. My favorite kind is science fiction. ___2___ science fiction stories are about the future, they also make us think about the present problems.\n\n1. Choose the best word:',options:['A.although','B.because','C.unless','D.until'],answer:'B',explanation:'because引导原因状语从句，"因为书籍打开新世界"',score:2 },
      { id:'e508',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'连词辨析',type:'choice',difficulty:'medium',question:'Passage:\nI love reading books ___1___ they open a new world for me. Every weekend, I go to the library to borrow books. My favorite kind is science fiction. ___2___ science fiction stories are about the future, they also make us think about the present problems.\n\n2. Choose the best word:',options:['A.Because','B.If','C.Although','D.As soon as'],answer:'C',explanation:'although"虽然"引导让步状语从句',score:2 },
      { id:'e509',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'代词辨析',type:'choice',difficulty:'easy',question:'Passage:\nI love reading books ___1___ they open a new world for me. Every weekend, I go to the library to borrow books. My favorite kind is science fiction. ___2___ science fiction stories are about the future, they also make us think about the present problems.\n\nWhat does "they" in the first sentence refer to?',options:['A.Libraries','B.Weekends','C.Books','D.Problems'],answer:'C',explanation:'they指代前文的books',score:2 },

      // ---- Passage 4 ----
      { id:'e510',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'时态辨析',type:'choice',difficulty:'medium',question:'Passage:\nMy best friend Lily ___1___ in this city since she was five years old. We have known each other for eight years. Last year, she ___2___ to another school, but we still keep in touch.\n\n1. Choose the best word:',options:['A.has lived','B.lived','C.lives','D.is living'],answer:'A',explanation:'since+过去时间点提示现在完成时has lived',score:2 },
      { id:'e511',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'时态辨析',type:'choice',difficulty:'medium',question:'Passage:\nMy best friend Lily ___1___ in this city since she was five years old. We have known each other for eight years. Last year, she ___2___ to another school, but we still keep in touch.\n\n2. Choose the best word:',options:['A.moves','B.has moved','C.moved','D.is moving'],answer:'C',explanation:'last year是过去时间状语，用一般过去时moved',score:2 },
      { id:'e512',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'词组辨析',type:'choice',difficulty:'medium',question:'Passage:\nMy best friend Lily ___1___ in this city since she was five years old. We have known each other for eight years. Last year, she ___2___ to another school, but we still keep in touch.\n\nWhat does "keep in touch" mean?',options:['A.保持联系','B.保持健康','C.保持安静','D.保持距离'],answer:'A',explanation:'keep in touch = stay in touch = 保持联系',score:2 },

      // ---- Passage 5 ----
      { id:'e513',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'名词辨析',type:'choice',difficulty:'easy',question:'Passage:\nDoing sports is good for our ___1___. Many students like playing basketball, football, or swimming. However, we should also be careful about safety. Warming up before doing sports can help prevent ___2___.\n\n1. Choose the best word:',options:['A.health','B.wealth','C.study','D.grade'],answer:'A',explanation:'做运动对身体"健康"有好处',score:2 },
      { id:'e514',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'名词辨析',type:'choice',difficulty:'easy',question:'Passage:\nDoing sports is good for our ___1___. Many students like playing basketball, football, or swimming. However, we should also be careful about safety. Warming up before doing sports can help prevent ___2___.\n\n2. Choose the best word:',options:['A.injuries','B.illnesses','C.mistakes','D.accidents'],answer:'A',explanation:'运动前热身可以防止"受伤"sports injuries',score:2 },
      { id:'e515',subject:'english',chapter:'完形填空',section:'完形填空',knowledgePoint:'主旨理解',type:'choice',difficulty:'medium',question:'Passage:\nDoing sports is good for our ___1___. Many students like playing basketball, football, or swimming. However, we should also be careful about safety. Warming up before doing sports can help prevent ___2___.\n\nWhat is the main idea of this passage?',options:['A.Sports are dangerous','B.We should do sports safely','C.Only play basketball','D.Never do sports'],answer:'B',explanation:'短文主旨：做运动有益健康，但也要注意安全',score:2 },
    ],
  },
  chinese: {
    grade8_down: [
      { id:'c01',subject:'chinese',chapter:'古诗文',section:'《关雎》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'关关雎鸠，__________。',answer:'在河之洲',explanation:'《诗经·关雎》开篇，以雎鸠和鸣起兴',score:2},
      { id:'c02',subject:'chinese',chapter:'古诗文',section:'《关雎》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'窈窕淑女，__________。',answer:'君子好逑',explanation:'《关雎》名句，表达对淑女的倾慕',score:2},
      { id:'c03',subject:'chinese',chapter:'古诗文',section:'《关雎》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'求之不得，__________。悠哉悠哉，辗转反侧。',answer:'寤寐思服',explanation:'描写主人公求而不得的思念之苦',score:2},
      { id:'c04',subject:'chinese',chapter:'古诗文',section:'《关雎》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'参差荇菜，左右采之。__________，琴瑟友之。',answer:'窈窕淑女',explanation:'《关雎》中君子追求淑女的经典句式',score:2},
      { id:'c05',subject:'chinese',chapter:'古诗文',section:'《关雎》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'参差荇菜，__________。窈窕淑女，钟鼓乐之。',answer:'左右芼之',explanation:'芼：挑选。全诗以婚礼钟鼓作结',score:2},
      { id:'c06',subject:'chinese',chapter:'古诗文',section:'《关雎》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'__________，寤寐求之。求之不得，寤寐思服。',answer:'窈窕淑女',explanation:'反复咏叹，是《诗经》重章叠句的体现',score:2},
      { id:'c07',subject:'chinese',chapter:'古诗文',section:'《蒹葭》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'蒹葭苍苍，__________。所谓伊人，在水一方。',answer:'白露为霜',explanation:'《诗经·蒹葭》开篇，以秋景起兴',score:2},
      { id:'c08',subject:'chinese',chapter:'古诗文',section:'《蒹葭》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'__________，在水一方。溯洄从之，道阻且长。',answer:'所谓伊人',explanation:'伊人：那个人，指所思念的人',score:2},
      { id:'c09',subject:'chinese',chapter:'古诗文',section:'《蒹葭》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'溯洄从之，__________。溯游从之，宛在水中央。',answer:'道阻且长',explanation:'描写追寻之路艰难险阻',score:2},
      { id:'c10',subject:'chinese',chapter:'古诗文',section:'《蒹葭》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'蒹葭萋萋，__________。所谓伊人，在水之湄。',answer:'白露未晞',explanation:'晞：干。萋萋：茂盛的样子',score:2},
      { id:'c11',subject:'chinese',chapter:'古诗文',section:'《送杜少府之任蜀州》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'海内存知己，__________。',answer:'天涯若比邻',explanation:'王勃名句，表达真挚友谊不受时空阻隔',score:2},
      { id:'c12',subject:'chinese',chapter:'古诗文',section:'《送杜少府之任蜀州》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'__________，风烟望五津。与君离别意，同是宦游人。',answer:'城阙辅三秦',explanation:'开篇点明送别地点和友人去向',score:2},
      { id:'c13',subject:'chinese',chapter:'古诗文',section:'《送杜少府之任蜀州》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'无为在歧路，__________。',answer:'儿女共沾巾',explanation:'劝慰友人莫作儿女之态',score:2},
      { id:'c14',subject:'chinese',chapter:'古诗文',section:'《茅屋为秋风所破歌》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'安得广厦千万间，__________！',answer:'大庇天下寒士俱欢颜',explanation:'杜甫忧国忧民的千古名句',score:2},
      { id:'c15',subject:'chinese',chapter:'古诗文',section:'《茅屋为秋风所破歌》',knowledgePoint:'古诗默写',type:'fill',difficulty:'hard',question:'何时眼前突兀见此屋，__________！',answer:'吾庐独破受冻死亦足',explanation:'体现杜甫舍己为人的崇高情怀',score:3},
      { id:'c16',subject:'chinese',chapter:'古诗文',section:'《茅屋为秋风所破歌》',knowledgePoint:'古诗默写',type:'fill',difficulty:'hard',question:'俄顷风定云墨色，__________。',answer:'秋天漠漠向昏黑',explanation:'描绘秋雨将至的阴沉景象',score:3},
      { id:'c17',subject:'chinese',chapter:'古诗文',section:'《卖炭翁》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'满面尘灰烟火色，__________。',answer:'两鬓苍苍十指黑',explanation:'白居易对卖炭翁外貌的生动描写',score:2},
      { id:'c18',subject:'chinese',chapter:'古诗文',section:'《卖炭翁》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'可怜身上衣正单，__________。',answer:'心忧炭贱愿天寒',explanation:'心理描写，深刻揭示卖炭翁的矛盾',score:2},
      { id:'c19',subject:'chinese',chapter:'古诗文',section:'《卖炭翁》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'__________，伐薪烧炭南山中。',answer:'卖炭翁',explanation:'开门见山点出人物和劳作地点',score:2},
      { id:'c20',subject:'chinese',chapter:'古诗文',section:'《卖炭翁》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'一车炭，千余斤，宫使驱将惜不得。__________，系向牛头充炭直。',answer:'半匹红纱一丈绫',explanation:'揭露宫市掠夺百姓的本质',score:2},
      { id:'c21',subject:'chinese',chapter:'古诗文',section:'《使至塞上》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'大漠孤烟直，__________。',answer:'长河落日圆',explanation:'王维名句，被王国维誉为千古壮观',score:2},
      { id:'c22',subject:'chinese',chapter:'古诗文',section:'《春望》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'感时花溅泪，__________。',answer:'恨别鸟惊心',explanation:'杜甫以乐景写哀情的名句',score:2},
      { id:'c23',subject:'chinese',chapter:'古诗文',section:'《春望》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'烽火连三月，__________。',answer:'家书抵万金',explanation:'杜甫写战乱中家书珍贵的名句',score:2},
      { id:'c24',subject:'chinese',chapter:'古诗文',section:'《游山西村》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'山重水复疑无路，__________。',answer:'柳暗花明又一村',explanation:'陆游名句，蕴含绝处逢生的哲理',score:2},
      { id:'c25',subject:'chinese',chapter:'古诗文',section:'《己亥杂诗》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'落红不是无情物，__________。',answer:'化作春泥更护花',explanation:'龚自珍以落花自喻，表达献身精神',score:2},
      { id:'c26',subject:'chinese',chapter:'古诗文',section:'《登飞来峰》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'不畏浮云遮望眼，__________。',answer:'自缘身在最高层',explanation:'王安石名句，表达高瞻远瞩的胸襟',score:2},
      { id:'c27',subject:'chinese',chapter:'古诗文',section:'《望岳》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'会当凌绝顶，__________。',answer:'一览众山小',explanation:'杜甫名句，抒发登临绝顶的豪情壮志',score:2},
      { id:'c28',subject:'chinese',chapter:'古诗文',section:'《次北固山下》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'潮平两岸阔，__________。',answer:'风正一帆悬',explanation:'王湾名句，以小景传大景之神',score:2},
      { id:'c29',subject:'chinese',chapter:'古诗文',section:'《次北固山下》',knowledgePoint:'古诗默写',type:'fill',difficulty:'medium',question:'__________，江春入旧年。',answer:'海日生残夜',explanation:'蕴含新事物必将取代旧事物的哲理',score:2},
      { id:'c30',subject:'chinese',chapter:'古诗文',section:'《饮酒》',knowledgePoint:'古诗默写',type:'fill',difficulty:'easy',question:'采菊东篱下，__________。',answer:'悠然见南山',explanation:'陶渊明田园诗的代表名句',score:2},
      { id:'c31',subject:'chinese',chapter:'古诗文',section:'《关雎》',knowledgePoint:'古诗理解',type:'choice',difficulty:'medium',question:'下列对《关雎》理解不正确的一项是（）',options:['A.以雎鸠和鸣起兴，引出君子对淑女的追求','B.流之采之芼之暗示君子追求淑女的过程','C.琴瑟友之表达恋爱时的欢乐','D.全诗表达了对战争的厌恶之情'],answer:'D',explanation:'《关雎》主题是爱情与婚姻，与战争无关',score:2},
      { id:'c32',subject:'chinese',chapter:'古诗文',section:'《蒹葭》',knowledgePoint:'古诗理解',type:'choice',difficulty:'medium',question:'《蒹葭》中蒹葭白露等意象营造的氛围是（）',options:['A.热烈欢快','B.萧瑟凄清','C.雄伟壮阔','D.宁静安详'],answer:'B',explanation:'蒹葭白露等秋景营造出朦胧凄清的氛围，衬托主人公求而不得的惆怅',score:2},
      { id:'c33',subject:'chinese',chapter:'古诗文',section:'《送杜少府之任蜀州》',knowledgePoint:'古诗理解',type:'choice',difficulty:'medium',question:'下列对“海内存知己，天涯若比邻”赏析恰当的一项是（）',options:['A.表达了诗人对功名的渴望','B.表达真挚友谊不受距离阻隔','C.表达了诗人壮志难酬的悲愤','D.表达了对故乡的深切思念'],answer:'B',explanation:'此句是千古送别名句，表达朋友间的深厚情谊不会因距离而改变',score:2},
      { id:'c34',subject:'chinese',chapter:'古诗文',section:'《茅屋为秋风所破歌》',knowledgePoint:'古诗理解',type:'choice',difficulty:'medium',question:'杜甫“安得广厦千万间，大庇天下寒士俱欢颜”体现的情怀是（）',options:['A.归隐田园的愿望','B.忧国忧民的博大胸襟','C.追求功名的抱负','D.对田园生活的向往'],answer:'B',explanation:'杜甫在自身困苦中仍心系天下寒士，体现了儒家仁者爱人的精神',score:2},
      { id:'c35',subject:'chinese',chapter:'古诗文',section:'《卖炭翁》',knowledgePoint:'古诗理解',type:'choice',difficulty:'medium',question:'《卖炭翁》中“可怜身上衣正单，心忧炭贱愿天寒”运用的写作手法是（）',options:['A.比喻','B.拟人','C.心理描写与对比','D.夸张'],answer:'C',explanation:'通过卖炭翁衣不蔽体却希望天更冷的矛盾心理，深刻揭示社会现实',score:2},
      { id:'c36',subject:'chinese',chapter:'古诗文',section:'《使至塞上》',knowledgePoint:'古诗理解',type:'choice',difficulty:'medium',question:'“大漠孤烟直，长河落日圆”被誉为千古壮观，其妙处在于（）',options:['A.运用了拟人手法','B.以简练线条勾勒出雄浑壮阔的边塞景象','C.表达了强烈的思乡之情','D.使用了大量典故'],answer:'B',explanation:'王维以直圆二字勾勒出边塞的壮美，构图简洁而意境深远',score:2},
      { id:'c37',subject:'chinese',chapter:'古诗文',section:'《春望》',knowledgePoint:'古诗理解',type:'choice',difficulty:'medium',question:'《春望》中“感时花溅泪，恨别鸟惊心”运用的修辞手法是（）',options:['A.比喻','B.拟人','C.借代','D.夸张'],answer:'B',explanation:'花鸟本无情，却因人伤感而溅泪惊心，是移情于物的拟人手法',score:2},
      { id:'c38',subject:'chinese',chapter:'古诗文',section:'《游山西村》',knowledgePoint:'古诗理解',type:'choice',difficulty:'easy',question:'“山重水复疑无路，柳暗花明又一村”蕴含的哲理是（）',options:['A.做事要坚持到底','B.困境中往往蕴含转机','C.时间是宝贵的','D.知识就是力量'],answer:'B',explanation:'此句比喻在困境中坚持下去终会看到希望，蕴含绝处逢生的人生哲理',score:2},
      { id:'c39',subject:'chinese',chapter:'古诗文',section:'《己亥杂诗》',knowledgePoint:'古诗理解',type:'choice',difficulty:'medium',question:'“落红不是无情物，化作春泥更护花”的表达方式是（）',options:['A.借景抒情','B.托物言志','C.直接抒情','D.借古讽今'],answer:'B',explanation:'龚自珍以落花自喻，托物言志，表达虽辞官仍关心国家命运的献身精神',score:2},
      { id:'c40',subject:'chinese',chapter:'古诗文',section:'《望岳》',knowledgePoint:'古诗理解',type:'choice',difficulty:'medium',question:'从《望岳》“会当凌绝顶，一览众山小”可以看出诗人（）',options:['A.不畏艰难勇于攀登的雄心壮志','B.对隐居生活的向往','C.对仕途失意的感慨','D.对友人离别的依依不舍'],answer:'A',explanation:'杜甫借登山抒发自己不畏艰难、勇于攀登的雄心壮志',score:2},
      { id:'c41',subject:'chinese',chapter:'文言文',section:'《桃花源记》',knowledgePoint:'文言默写',type:'fill',difficulty:'easy',question:'缘溪行，__________。',answer:'忘路之远近',explanation:'陶渊明《桃花源记》开篇，暗示渔人进入奇幻世界',score:2},
      { id:'c42',subject:'chinese',chapter:'文言文',section:'《桃花源记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'芳草鲜美，__________。',answer:'落英缤纷',explanation:'描写桃花林的美景，落英即落花',score:2},
      { id:'c43',subject:'chinese',chapter:'文言文',section:'《桃花源记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'土地平旷，__________，有良田、美池、桑竹之属。',answer:'屋舍俨然',explanation:'俨然：整齐的样子',score:2},
      { id:'c44',subject:'chinese',chapter:'文言文',section:'《桃花源记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'__________，鸡犬相闻。',answer:'阡陌交通',explanation:'阡陌：田间小路。描写桃花源中道路四通八达',score:2},
      { id:'c45',subject:'chinese',chapter:'文言文',section:'《桃花源记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'__________，并怡然自乐。',answer:'黄发垂髫',explanation:'黄发：老人；垂髫：小孩。描写桃花源中人各得其乐',score:2},
      { id:'c46',subject:'chinese',chapter:'文言文',section:'《桃花源记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'问今是何世，__________，无论魏晋。',answer:'乃不知有汉',explanation:'桃花源中人与世隔绝数百年，不知朝代更迭',score:2},
      { id:'c47',subject:'chinese',chapter:'文言文',section:'《桃花源记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'此人一一为具言所闻，__________。',answer:'皆叹惋',explanation:'桃花源中人对洞外世事变故感叹惋惜',score:2},
      { id:'c48',subject:'chinese',chapter:'文言文',section:'《桃花源记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'此中人语云：__________。',answer:'不足为外人道也',explanation:'桃花源中人不愿被外人打扰，为后文迷失铺垫',score:2},
      { id:'c49',subject:'chinese',chapter:'文言文',section:'《小石潭记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'隔篁竹，__________，心乐之。',answer:'闻水声如鸣佩环',explanation:'柳宗元以佩环之声比喻水声清脆悦耳',score:2},
      { id:'c50',subject:'chinese',chapter:'文言文',section:'《小石潭记》',knowledgePoint:'文言默写',type:'fill',difficulty:'hard',question:'青树翠蔓，__________，参差披拂。',answer:'蒙络摇缀',explanation:'描写潭边树木藤蔓缠绕飘拂的景象',score:3},
      { id:'c51',subject:'chinese',chapter:'文言文',section:'《小石潭记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'潭中鱼可百许头，__________。',answer:'皆若空游无所依',explanation:'以鱼若悬空写水之清澈，侧面烘托手法',score:2},
      { id:'c52',subject:'chinese',chapter:'文言文',section:'《小石潭记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'日光下澈，__________。',answer:'影布石上',explanation:'阳光直照潭底，鱼影映在石上',score:2},
      { id:'c53',subject:'chinese',chapter:'文言文',section:'《小石潭记》',knowledgePoint:'文言默写',type:'fill',difficulty:'hard',question:'佁然不动，__________，往来翕忽。',answer:'俶尔远逝',explanation:'佁然：静止；俶尔：忽然。描写鱼静动相宜',score:3},
      { id:'c54',subject:'chinese',chapter:'文言文',section:'《小石潭记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'__________，悄怆幽邃。',answer:'凄神寒骨',explanation:'柳宗元借景抒情，表达被贬后的孤寂悲凉',score:2},
      { id:'c55',subject:'chinese',chapter:'文言文',section:'《核舟记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'能以径寸之木，__________。',answer:'为宫室器皿人物',explanation:'魏学洢赞叹王叔远微雕技艺高超',score:2},
      { id:'c56',subject:'chinese',chapter:'文言文',section:'《核舟记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'罔不因势象形，__________。',answer:'各具情态',explanation:'罔不：无不。描写雕刻人物栩栩如生',score:2},
      { id:'c57',subject:'chinese',chapter:'文言文',section:'《核舟记》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'__________，钩画了了，其色墨。',answer:'细若蚊足',explanation:'描写核舟上题字笔画细如蚊足却清晰可辨',score:2},
      { id:'c58',subject:'chinese',chapter:'文言文',section:'《北冥有鱼》',knowledgePoint:'文言默写',type:'fill',difficulty:'easy',question:'北冥有鱼，__________。',answer:'其名为鲲',explanation:'庄子《逍遥游》开篇，鲲为传说中的大鱼',score:2},
      { id:'c59',subject:'chinese',chapter:'文言文',section:'《北冥有鱼》',knowledgePoint:'文言默写',type:'fill',difficulty:'medium',question:'化而为鸟，__________。',answer:'其名为鹏',explanation:'鲲化为鹏，比喻巨大的变化',score:2},
      { id:'c60',subject:'chinese',chapter:'文言文',section:'《北冥有鱼》',knowledgePoint:'文言默写',type:'fill',difficulty:'hard',question:'鹏之徙于南冥也，__________，抟扶摇而上者九万里。',answer:'水击三千里',explanation:'描写大鹏起飞时气势磅礴的景象',score:3},
      { id:'c61',subject:'chinese',chapter:'文言文',section:'《桃花源记》',knowledgePoint:'内容理解',type:'choice',difficulty:'medium',question:'下列对《桃花源记》理解不正确的一项是（）',options:['A.桃花源是作者虚构的理想社会','B.反映了作者对现实社会的不满','C.桃花源中人不愿与外界来往','D.表达了作者对战争的歌颂'],answer:'D',explanation:'陶渊明借桃花源表达对和平安宁生活的向往，而非歌颂战争',score:2},
      { id:'c62',subject:'chinese',chapter:'文言文',section:'《桃花源记》',knowledgePoint:'内容理解',type:'choice',difficulty:'medium',question:'渔人离开桃花源后“处处志之”却“不复得路”，其作用是（）',options:['A.说明渔人记性不好','B.暗示桃花源是虚构的','C.说明太守不重视','D.说明路途确实遥远'],answer:'B',explanation:'此情节增添了桃花源的神秘色彩，暗示它是作者虚构的理想世界',score:2},
      { id:'c63',subject:'chinese',chapter:'文言文',section:'《小石潭记》',knowledgePoint:'内容理解',type:'choice',difficulty:'medium',question:'《小石潭记》中作者的情感变化是（）',options:['A.始终快乐','B.由乐到忧','C.由忧到乐','D.始终忧伤'],answer:'B',explanation:'柳宗元初闻水声心乐之，后因环境凄清触发被贬的忧伤',score:2},
      { id:'c64',subject:'chinese',chapter:'文言文',section:'《小石潭记》',knowledgePoint:'写作手法',type:'choice',difficulty:'medium',question:'《小石潭记》写潭中游鱼“皆若空游无所依”运用的手法是（）',options:['A.正面描写','B.侧面烘托','C.对比','D.夸张'],answer:'B',explanation:'通过写鱼如悬空而游，侧面烘托潭水之清澈透明',score:2},
      { id:'c65',subject:'chinese',chapter:'文言文',section:'《核舟记》',knowledgePoint:'内容理解',type:'choice',difficulty:'medium',question:'《核舟记》中核舟的主题是（）',options:['A.大苏泛赤壁','B.八仙过海','C.清明上河图','D.兰亭集序'],answer:'A',explanation:'核舟雕刻的是苏轼泛舟赤壁的情景',score:2},
      { id:'c66',subject:'chinese',chapter:'文言文',section:'《核舟记》',knowledgePoint:'写作手法',type:'choice',difficulty:'medium',question:'《核舟记》的结构特点是（）',options:['A.总—分','B.分—总','C.总—分—总','D.并列式'],answer:'C',explanation:'先总写王叔远技艺精湛，再分写核舟各处，最后总结赞叹',score:2},
      { id:'c67',subject:'chinese',chapter:'文言文',section:'《北冥有鱼》',knowledgePoint:'内容理解',type:'choice',difficulty:'medium',question:'《北冥有鱼》中“鹏”的形象象征（）',options:['A.渺小与卑微','B.自由与远大志向','C.邪恶与黑暗','D.平庸与普通'],answer:'B',explanation:'庄子以大鹏象征超越世俗、追求绝对自由的远大理想',score:2},
      { id:'c68',subject:'chinese',chapter:'文言文',section:'《北冥有鱼》',knowledgePoint:'内容理解',type:'choice',difficulty:'medium',question:'下列对《北冥有鱼》理解有误的一项是（）',options:['A.出自道家经典《庄子》','B.运用了丰富的想象和夸张','C.鲲鹏是真实存在的生物','D.表达了追求精神自由的思想'],answer:'C',explanation:'鲲鹏是庄子虚构的意象，并非真实存在的生物',score:2},
      { id:'c69',subject:'chinese',chapter:'文言文',section:'《核舟记》',knowledgePoint:'内容理解',type:'choice',difficulty:'medium',question:'《核舟记》中核舟上雕刻的人物不包括（）',options:['A.苏轼','B.黄庭坚','C.佛印','D.欧阳修'],answer:'D',explanation:'核舟上刻有苏轼黄庭坚佛印三人，不含欧阳修',score:2},
      { id:'c70',subject:'chinese',chapter:'文言文',section:'《小石潭记》',knowledgePoint:'内容理解',type:'choice',difficulty:'medium',question:'《小石潭记》中作者感到“凄神寒骨，悄怆幽邃”的原因是（）',options:['A.天气太冷','B.潭水太深','C.环境过于安静','D.环境凄清触发了被贬的悲凉心境'],answer:'D',explanation:'柳宗元因参与永贞革新被贬永州，借景抒情表达内心孤寂',score:2},
      { id:'c71',subject:'chinese',chapter:'文言文',section:'实词虚词辨析',knowledgePoint:'实词辨析',type:'choice',difficulty:'medium',question:'下列加点词解释有误的一项是（）',options:['A.缘溪行（沿着）','B.渔人甚异之（奇怪）','C.便扶向路（先前的）','D.诣太守（拜访）'],answer:'B',explanation:'异在此处意为感到惊异，是意动用法，非奇怪',score:2},
      { id:'c72',subject:'chinese',chapter:'文言文',section:'实词虚词辨析',knowledgePoint:'实词辨析',type:'choice',difficulty:'medium',question:'下列加点词意思相同的一项是（）',options:['A.寻向所志/未果寻病终','B.便舍船/屋舍俨然','C.处处志之/寻向所志','D.具答之/各具情态'],answer:'C',explanation:'C中两个志都是做标记的意思。A中寻分别是寻找和不久',score:2},
      { id:'c73',subject:'chinese',chapter:'文言文',section:'实词虚词辨析',knowledgePoint:'实词辨析',type:'choice',difficulty:'medium',question:'下列“之”字用法与其他三项不同的一项是（）',options:['A.忘路之远近','B.闻之水声','C.渔人甚异之','D.具答之'],answer:'A',explanation:'A中之为结构助词的，B/C/D中之为代词',score:2},
      { id:'c74',subject:'chinese',chapter:'文言文',section:'实词虚词辨析',knowledgePoint:'实词辨析',type:'choice',difficulty:'medium',question:'下列加点词与“斗折蛇行”中“斗”用法相同的是（）',options:['A.潭西南而望','B.其岸势犬牙差互','C.凄神寒骨','D.心乐之'],answer:'B',explanation:'斗和犬牙都是名词作状语，分别表示像北斗星一样像狗牙一样',score:2},
      { id:'c75',subject:'chinese',chapter:'文言文',section:'实词虚词辨析',knowledgePoint:'实词辨析',type:'choice',difficulty:'medium',question:'下列“而”字用法表转折的一项是（）',options:['A.潭西南而望','B.乃记之而去','C.而计其长曾不盈寸','D.中峨冠而多髯者'],answer:'C',explanation:'C中而表转折然而。A表修饰，B表顺承，D表并列',score:2},
      { id:'c76',subject:'chinese',chapter:'文言文',section:'实词虚词辨析',knowledgePoint:'虚词辨析',type:'choice',difficulty:'medium',question:'下列“其”字用法不同的一项是（）',options:['A.其名为鲲','B.不知其几千里也','C.其岸势犬牙差互','D.其视下也'],answer:'C',explanation:'C中其是指示代词那，其余为人称代词它的',score:2},
      { id:'c77',subject:'chinese',chapter:'文言文',section:'实词虚词辨析',knowledgePoint:'虚词辨析',type:'choice',difficulty:'medium',question:'下列句子中没有通假字的一项是（）',options:['A.便要还家','B.诎右臂支船','C.北冥有鱼','D.水尤清冽'],answer:'D',explanation:'A要通邀，B诎通屈，C冥通溟',score:2},
      { id:'c78',subject:'chinese',chapter:'文言文',section:'实词虚词辨析',knowledgePoint:'虚词辨析',type:'choice',difficulty:'hard',question:'下列“以”字用法与“以其境过清”相同的是（）',options:['A.能以径寸之木','B.卷石底以出','C.不以物喜不以己悲','D.全石以为底'],answer:'C',explanation:'C和例句中的以都是介词因为。A用，B表修饰，D把',score:3},
      { id:'c79',subject:'chinese',chapter:'文言文',section:'实词虚词辨析',knowledgePoint:'虚词辨析',type:'choice',difficulty:'medium',question:'下列“乃”字解释有误的一项是（）',options:['A.乃不知有汉（竟然）','B.乃记之而去（于是）','C.乃大惊（于是）','D.乃重修岳阳楼（于是）'],answer:'A',explanation:'A中乃意为竟然解释正确，题干有误',score:2},
      { id:'c80',subject:'chinese',chapter:'文言文',section:'实词虚词辨析',knowledgePoint:'虚词辨析',type:'choice',difficulty:'hard',question:'对“之”字用法分类正确的一项是（）①忘路之远近②渔人甚异之③闻之欣然规往④处处志之⑤何陋之有⑥水陆草木之花',options:['A.①⑥/②③④/⑤','B.①⑤/②③/④⑥','C.①⑥/③④/②⑤','D.①/②③④/⑤⑥'],answer:'A',explanation:'①⑥结构助词的，②③④代词，⑤宾语前置标志',score:3},
      { id:'c81',subject:'chinese',chapter:'名著阅读',section:'《傅雷家书》',knowledgePoint:'名著知识',type:'fill',difficulty:'easy',question:'《傅雷家书》是傅雷写给儿子__________的家信集。',answer:'傅聪',explanation:'傅雷的长子傅聪是著名钢琴家，家书主要写给他',score:2},
      { id:'c82',subject:'chinese',chapter:'名著阅读',section:'《傅雷家书》',knowledgePoint:'名著知识',type:'fill',difficulty:'medium',question:'傅雷教导儿子：__________是第一把艺术的钥匙。',answer:'真诚',explanation:'傅雷强调做人要真诚，艺术也是如此',score:2},
      { id:'c83',subject:'chinese',chapter:'名著阅读',section:'《傅雷家书》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'《傅雷家书》中傅雷教育儿子的核心内容是（）',options:['A.如何赚更多钱','B.如何做一个德艺俱备人格卓越的艺术家','C.如何获得权力','D.如何逃避现实'],answer:'B',explanation:'傅雷注重培养儿子的人格修养和艺术素养',score:2},
      { id:'c84',subject:'chinese',chapter:'名著阅读',section:'《傅雷家书》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'下列对《傅雷家书》理解有误的一项是（）',options:['A.是傅雷夫妇写给儿子的书信集','B.体现了傅雷对儿子深沉的父爱','C.只讨论钢琴演奏技巧','D.是一部充满父爱的教子名篇'],answer:'C',explanation:'家书内容广泛涉及艺术人生道德情感等，不限于钢琴技巧',score:2},
      { id:'c85',subject:'chinese',chapter:'名著阅读',section:'《傅雷家书》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'《傅雷家书》的艺术特色不包括（）',options:['A.情感真挚深沉','B.语言亲切自然','C.说理空洞抽象','D.融艺术与人生为一体'],answer:'C',explanation:'傅雷家书说理具体恳切，不空洞，富有感染力',score:2},
      { id:'c86',subject:'chinese',chapter:'名著阅读',section:'《傅雷家书》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'傅雷在信中多次提到的艺术家修养不包括（）',options:['A.爱国情怀','B.人格修养','C.艺术素养','D.追求名利'],answer:'D',explanation:'傅雷教育儿子淡泊名利追求艺术真谛',score:2},
      { id:'c87',subject:'chinese',chapter:'名著阅读',section:'《钢铁是怎样炼成的》',knowledgePoint:'名著知识',type:'fill',difficulty:'easy',question:'《钢铁是怎样炼成的》作者是苏联作家__________。',answer:'奥斯特洛夫斯基',explanation:'作者尼古拉·奥斯特洛夫斯基在双目失明后完成此书',score:2},
      { id:'c88',subject:'chinese',chapter:'名著阅读',section:'《钢铁是怎样炼成的》',knowledgePoint:'名著知识',type:'fill',difficulty:'easy',question:'保尔说：人最宝贵的是__________。',answer:'生命',explanation:'出自保尔关于生命意义的名言',score:2},
      { id:'c89',subject:'chinese',chapter:'名著阅读',section:'《钢铁是怎样炼成的》',knowledgePoint:'名著知识',type:'choice',difficulty:'easy',question:'《钢铁是怎样炼成的》主人公是（）',options:['A.朱赫来','B.保尔·柯察金','C.冬妮亚','D.谢廖沙'],answer:'B',explanation:'保尔·柯察金是小说的核心人物',score:2},
      { id:'c90',subject:'chinese',chapter:'名著阅读',section:'《钢铁是怎样炼成的》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'小说标题“钢铁是怎样炼成的”其象征意义是（）',options:['A.介绍钢铁冶炼技术','B.比喻革命战士在艰苦斗争中锻炼成长','C.描述苏联工业发展','D.讲述冶金工人的故事'],answer:'B',explanation:'钢铁比喻革命战士的坚强意志是在烈火与骤冷中炼成的',score:2},
      { id:'c91',subject:'chinese',chapter:'名著阅读',section:'《钢铁是怎样炼成的》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'保尔最终通过什么方式继续为革命事业奋斗（）',options:['A.上前线作战','B.文学创作','C.当老师','D.经商'],answer:'B',explanation:'保尔双目失明后开始文学创作完成了小说',score:2},
      { id:'c92',subject:'chinese',chapter:'名著阅读',section:'《钢铁是怎样炼成的》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'下列不属于保尔精神品质的是（）',options:['A.顽强不屈','B.为理想献身','C.意志如钢','D.贪图享乐'],answer:'D',explanation:'保尔是坚韧不拔的革命战士形象',score:2},
      { id:'c93',subject:'chinese',chapter:'名著阅读',section:'《钢铁是怎样炼成的》',knowledgePoint:'名著知识',type:'fill',difficulty:'medium',question:'保尔在__________（地点）筑路时感染伤寒几乎丧命。',answer:'博亚尔卡',explanation:'筑路是保尔人生中的重要考验',score:2},
      { id:'c94',subject:'chinese',chapter:'名著阅读',section:'《朝花夕拾》',knowledgePoint:'名著知识',type:'choice',difficulty:'easy',question:'《朝花夕拾》的作者是（）',options:['A.老舍','B.鲁迅','C.冰心','D.朱自清'],answer:'B',explanation:'鲁迅的回忆性散文集原名《旧事重提》',score:2},
      { id:'c95',subject:'chinese',chapter:'名著阅读',section:'《朝花夕拾》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'下列篇目不属于《朝花夕拾》的是（）',options:['A.《从百草园到三味书屋》','B.《藤野先生》','C.《阿长与山海经》','D.《故乡》'],answer:'D',explanation:'《故乡》出自鲁迅小说集《呐喊》',score:2},
      { id:'c96',subject:'chinese',chapter:'名著阅读',section:'《西游记》',knowledgePoint:'名著知识',type:'choice',difficulty:'easy',question:'《西游记》中孙悟空的武器是（）',options:['A.方天画戟','B.如意金箍棒','C.青龙偃月刀','D.丈八蛇矛'],answer:'B',explanation:'金箍棒重一万三千五百斤，是东海的定海神针',score:2},
      { id:'c97',subject:'chinese',chapter:'名著阅读',section:'《骆驼祥子》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'《骆驼祥子》中祥子最终的结局是（）',options:['A.实现了买车梦想','B.成为社会底层行尸走肉','C.回乡种田','D.成为工厂老板'],answer:'B',explanation:'祥子经历了三起三落后彻底堕落',score:2},
      { id:'c98',subject:'chinese',chapter:'名著阅读',section:'《海底两万里》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'《海底两万里》中诺第留斯号的船长是（）',options:['A.阿龙纳斯','B.康塞尔','C.尼摩','D.尼德·兰'],answer:'C',explanation:'尼摩船长是一位充满神秘色彩的复仇者',score:2},
      { id:'c99',subject:'chinese',chapter:'名著阅读',section:'《红星照耀中国》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'《红星照耀中国》的作者是（）',options:['A.斯诺','B.毛泽东','C.周恩来','D.鲁迅'],answer:'A',explanation:'美国记者埃德加·斯诺访问陕北革命根据地后写成此书',score:2},
      { id:'c100',subject:'chinese',chapter:'名著阅读',section:'《昆虫记》',knowledgePoint:'名著知识',type:'choice',difficulty:'medium',question:'《昆虫记》被誉为（）',options:['A.昆虫的史诗','B.动物小说之王','C.科普读物之首','D.童话经典'],answer:'A',explanation:'法布尔的《昆虫记》既有科学价值又有文学价值',score:2},
      { id:'c101',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字音辨析',type:'choice',difficulty:'medium',question:'下列加点字读音完全正确的一项是（）',options:['A.绯红(fěi) 解剖(pōu)','B.炽热(zhì) 缄默(jiān)','C.撺掇(cuān) 羁绊(jī)','D.龟裂(guī) 狩猎(shòu)'],answer:'C',explanation:'A绯fēi红，B炽chì热，D龟jūn裂',score:2},
      { id:'c102',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字音辨析',type:'choice',difficulty:'medium',question:'下列加点字读音有误的一项是（）',options:['A.斡旋(wò) 晦暗(huì)','B.羁绊(jī) 冗杂(rǒng)','C.戛然而止(gá) 锵然(qiāng)','D.凫水(fú) 潺潺(chán)'],answer:'C',explanation:'戛jiá然而止，不是gá',score:2},
      { id:'c103',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字音辨析',type:'choice',difficulty:'hard',question:'下列词语中加点字读音全部正确的一项是（）',options:['A.襁褓(qiǎng) 襁褓(qiáng)','B.翌日(yì) 俯瞰(kàn)','C.腈纶(qíng) 缄默(jiān)','D.陨石(yǔn) 追溯(shuò)'],answer:'B',explanation:'A襁qiǎng褓，C腈jīng纶，D追溯sù',score:3},
      { id:'c104',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字音辨析',type:'choice',difficulty:'medium',question:'下列加点字读音不同的一组是（）',options:['A.寒噤/禁止','B.蛮横/横财','C.拾级/收拾','D.倔强/强大'],answer:'C',explanation:'C拾shè级/收shí拾。A都读jìn，B都读hèng，D强jiàng/qiáng',score:2},
      { id:'c105',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字音辨析',type:'choice',difficulty:'medium',question:'下列词语注音错误的是（）',options:['A.雾霭(ǎi) 缄默(jiān)','B.龟裂(guī) 沟壑(hè)','C.帷幕(wéi) 狩猎(shòu)','D.凋零(diāo) 褶皱(zhě)'],answer:'B',explanation:'龟裂应读jūn，不是guī',score:2},
      { id:'c106',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字形辨析',type:'choice',difficulty:'medium',question:'下列词语书写完全正确的一项是（）',options:['A.震撼 急躁 名副其实','B.迁徙 松驰 川流不息','C.妨碍 追溯 一愁莫展','D.妥帖 幅射 再接再厉'],answer:'A',explanation:'B松弛(驰→弛)，C一筹莫展(愁→筹)，D辐射(幅→辐)',score:2},
      { id:'c107',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字形辨析',type:'choice',difficulty:'medium',question:'下列词语中字形全部正确的一项是（）',options:['A.大彻大悟 叹为观止','B.人情事故 销声匿迹','C.天衣无逢 目眩神迷','D.草长鹰飞 海枯石烂'],answer:'A',explanation:'B人情世故(事→世) 销声匿迹(销正确)，C天衣无缝(逢→缝)，D草长莺飞(鹰→莺)',score:2},
      { id:'c108',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字形辨析',type:'choice',difficulty:'medium',question:'下列各组词语中没有错别字的一项是（）',options:['A.抉择 狡辩 格物致知','B.浮躁 喧哗 不修边副','C.浮躁 喧哗 格物致知','D.苍劲 缭绕 轻歌慢舞'],answer:'A',explanation:'B不修边幅(副→幅)，D轻歌曼舞(慢→曼)',score:2},
      { id:'c109',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字形辨析',type:'choice',difficulty:'hard',question:'下列词语中字形全部正确的一项是（）',options:['A.陨石 幅射 消声匿迹','B.帷幕 狩猎 周而复始','C.枯燥 怠慢 目炫神迷','D.山麓 沟壑 草长鹰飞'],answer:'B',explanation:'A辐射 销声匿迹(消→销)，C目眩神迷(炫→眩)，D草长莺飞(鹰→莺)',score:3},
      { id:'c110',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字形辨析',type:'choice',difficulty:'medium',question:'下列成语书写正确的一项是（）',options:['A.世外桃园','B.豁然开朗','C.落英宾纷','D.迁陌交通'],answer:'B',explanation:'A世外桃源(园→源)，C落英缤纷(宾→缤)，D阡陌交通(迁→阡)',score:2},
      { id:'c111',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字音填空',type:'fill',difficulty:'medium',question:'“龟裂”中“龟”的读音是__________。',answer:'jūn',explanation:'龟裂指皮肤因寒冷干燥而开裂，读jūn不读guī',score:2},
      { id:'c112',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字形填空',type:'fill',difficulty:'medium',question:'xiāo shēng nì jì（__________）',answer:'销声匿迹',explanation:'指隐藏起来不再公开露面。注意销不是消',score:2},
      { id:'c113',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字形填空',type:'fill',difficulty:'medium',question:'qiǎng bǎo（__________）',answer:'襁褓',explanation:'包裹婴儿的被子和带子，注意偏旁部首',score:2},
      { id:'c114',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字音填空',type:'fill',difficulty:'medium',question:'“戛然而止”中“戛”的读音是__________。',answer:'jiá',explanation:'戛读jiá不读gá，形容声音突然停止',score:2},
      { id:'c115',subject:'chinese',chapter:'基础知识',section:'字音字形',knowledgePoint:'字形填空',type:'fill',difficulty:'medium',question:'jiān mò（__________）：闭口不说话。',answer:'缄默',explanation:'缄：封闭。注意左边是纟',score:2},
      { id:'c116',subject:'chinese',chapter:'基础知识',section:'成语运用',knowledgePoint:'成语辨析',type:'choice',difficulty:'medium',question:'下列句子中成语使用恰当的一项是（）',options:['A.他对于这个问题一窍不通','B.这些画栩栩如生在墙上挂着','C.他每次考试都名列前茅真是罄竹难书','D.这个好消息真是让人忍俊不禁地笑出来'],answer:'A',explanation:'一窍不通指完全不懂。D忍俊不禁本身含笑意不能与笑连用',score:2},
      { id:'c117',subject:'chinese',chapter:'基础知识',section:'成语运用',knowledgePoint:'成语辨析',type:'choice',difficulty:'medium',question:'下列成语使用有误的一项是（）',options:['A.同学们对这次活动趋之若鹜','B.这段旋律让人叹为观止','C.这件工艺品巧夺天工','D.他目空一切的态度让人反感'],answer:'A',explanation:'趋之若鹜是贬义词指追逐不正当的事物不能用于积极参加活动',score:2},
      { id:'c118',subject:'chinese',chapter:'基础知识',section:'成语运用',knowledgePoint:'成语辨析',type:'choice',difficulty:'medium',question:'下列成语使用恰当的一项是（）',options:['A.他滔滔不绝地讲了一个小时','B.歹徒锐不可当地冲进银行','C.他的罪行罄竹难书令人发指','D.春天来了公园里花香鸟语草长莺飞'],answer:'D',explanation:'A滔滔不绝含贬义，B锐不可当是褒义词用于反面对象不当，C程度过重用于极端罪行',score:2},
      { id:'c119',subject:'chinese',chapter:'基础知识',section:'成语运用',knowledgePoint:'成语辨析',type:'choice',difficulty:'hard',question:'下列各句中加点的成语使用不恰当的一项是（）',options:['A.他的演讲慷慨激昂令人叹为观止','B.大自然周而复始地运行着','C.这件事处理得人情世故面面俱到','D.他目空一切的态度让人反感'],answer:'C',explanation:'人情世故是名词性成语不能作状语修饰谓语',score:3},
      { id:'c120',subject:'chinese',chapter:'基础知识',section:'成语运用',knowledgePoint:'成语辨析',type:'choice',difficulty:'medium',question:'下列成语使用正确的一项是（）',options:['A.他每次发言都夸夸其谈让人厌烦','B.广场上人声鼎沸热闹非凡','C.这道菜的味道让人叹为观止','D.他做错了事还强词夺理真是罄竹难书'],answer:'B',explanation:'A夸夸其谈含贬义，C叹为观止用于视觉不用于味觉，D罄竹难书用于罪行',score:2},
      { id:'c121',subject:'chinese',chapter:'基础知识',section:'成语运用',knowledgePoint:'成语填空',type:'fill',difficulty:'medium',question:'这个花园里的花种类繁多色彩斑斓让人__________（眼睛看不过来）。',answer:'目不暇接',explanation:'目不暇接：东西太多眼睛看不过来。注意暇是日字旁',score:2},
      { id:'c122',subject:'chinese',chapter:'基础知识',section:'成语运用',knowledgePoint:'成语填空',type:'fill',difficulty:'medium',question:'他做事总是一丝不苟__________（从开始到结束都认真）。',answer:'善始善终',explanation:'善始善终：从开头到结束都做得很好',score:2},
      { id:'c123',subject:'chinese',chapter:'基础知识',section:'成语运用',knowledgePoint:'成语填空',type:'fill',difficulty:'medium',question:'这次考试他准备充分__________（心里已经有完整的谋划）。',answer:'胸有成竹',explanation:'胸有成竹：比喻做事前已有充分的准备和把握',score:2},
      { id:'c124',subject:'chinese',chapter:'基础知识',section:'成语运用',knowledgePoint:'成语填空',type:'fill',difficulty:'medium',question:'她的歌声婉转动听如__________（好像黄莺在山谷中鸣叫）。',answer:'莺啼燕语',explanation:'形容声音悦耳动听',score:2},
      { id:'c125',subject:'chinese',chapter:'基础知识',section:'成语运用',knowledgePoint:'成语填空',type:'fill',difficulty:'medium',question:'他__________（形容意志坚定不可动摇）地拒绝了对方的贿赂。',answer:'斩钉截铁',explanation:'斩钉截铁：形容说话或行动坚决果断毫不犹豫',score:2},
      { id:'c126',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'成分残缺',type:'choice',difficulty:'medium',question:'下列句子没有语病的一项是（）',options:['A.通过这次学习使我提高了认识','B.我们要养成认真读书的习惯','C.他大约用了两小时左右','D.春天的榆林是一个美丽的季节'],answer:'B',explanation:'A缺主语删通过或使，C大约和左右重复，D搭配不当应改为榆林的春天',score:2},
      { id:'c127',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'成分残缺',type:'choice',difficulty:'medium',question:'下列句子有语病的一项是（）',options:['A.他完成了老师布置的所有作业','B.由于他的努力使成绩有了很大提高','C.教室里传来了朗朗的读书声','D.这是一件很有意义的事情'],answer:'B',explanation:'B缺主语删由于或使',score:2},
      { id:'c128',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'搭配不当',type:'choice',difficulty:'medium',question:'下列句子没有语病的一项是（）',options:['A.他的写作水平有了明显的改进','B.秋天的北京是最美的季节','C.我们一定要发扬和继承优良传统','D.他终于看到了胜利的曙光'],answer:'D',explanation:'A水平应与提高搭配，B北京不是季节，C语序不当应先继承后发扬',score:2},
      { id:'c129',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'语序不当',type:'choice',difficulty:'medium',question:'下列句子没有语病的一项是（）',options:['A.我们讨论并听取了校长的报告','B.博物馆展出了两千多年前新出土的文物','C.他在运动会上为班级赢得了荣誉','D.这是一件珍贵的妈妈从国外带回来的礼物'],answer:'C',explanation:'A应先听取后讨论，B应为新出土的两千多年前的文物，D语序不当',score:2},
      { id:'c130',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'句式杂糅',type:'choice',difficulty:'hard',question:'下列句子没有语病的一项是（）',options:['A.他的家乡是陕西榆林人','B.我们能不能培养出四有新人','C.考试能否取得好成绩取决于平时的努力','D.他的学习成绩好的原因是因为他刻苦努力'],answer:'B',explanation:'A去掉人，C一面对两面，D原因和因为重复',score:3},
      { id:'c131',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'搭配不当',type:'choice',difficulty:'medium',question:'下列句子有语病的一项是（）',options:['A.经过努力我的学习成绩提高了','B.我们一定要继承和发扬中华民族的优良传统','C.他的写作能力有了明显的进步','D.晚会上表演了优美的舞蹈和动听的歌曲'],answer:'D',explanation:'表演歌曲搭配不当，应改为演唱了动听的歌曲',score:2},
      { id:'c132',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'不合逻辑',type:'choice',difficulty:'medium',question:'下列句子没有语病的一项是（）',options:['A.这学期他基本上完全改掉了坏习惯','B.为了防止溺水事故不再发生学校加强了安全教育','C.我们要响应党的号召做新时代的好少年','D.他大概应该是今天下午到达'],answer:'C',explanation:'A基本上和完全矛盾，B防止不双重否定，D大概和应该重复',score:2},
      { id:'c133',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'表意不明',type:'choice',difficulty:'hard',question:'下列句子没有歧义的一项是（）',options:['A.他走了半小时了','B.三个学校的校长参加了会议','C.小明和小华的爸爸一起来了','D.这是一本很有价值的参考书'],answer:'D',explanation:'A走可指离开或行走，B三个可修饰学校或校长，C不明确',score:3},
      { id:'c134',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'搭配不当',type:'choice',difficulty:'medium',question:'下列句子没有语病的一项是（）',options:['A.人民的生活水平正在不断地改善','B.他的革命精神时刻浮现在我眼前','C.沙沙的浪声和银光闪闪的海面构成一幅好看的画面','D.这个问题引起了大家的广泛关注'],answer:'D',explanation:'A水平应提高，B精神不能浮现，C浪声不能构成画面',score:2},
      { id:'c135',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'成分赘余',type:'choice',difficulty:'medium',question:'下列句子有语病的一项是（）',options:['A.他忍俊不禁地笑了起来','B.这次比赛我们取得了优异的成绩','C.教室被打扫得干干净净','D.春天到了万物复苏'],answer:'A',explanation:'忍俊不禁已含笑的意思与笑了起来重复',score:2},
      { id:'c136',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'语序不当',type:'choice',difficulty:'hard',question:'下列句子中语序正确的一项是（）',options:['A.我们要认真克服并善于发现学习中的困难','B.新出土的两千多年前的文物在博物馆展出了','C.他是一位优秀的有二十多年教学经验的语文老师','D.她是一个漂亮的聪明的善良的女孩'],answer:'B',explanation:'A应先发现后克服，C定语语序不当，D语序不当',score:3},
      { id:'c137',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'两面失衡',type:'choice',difficulty:'hard',question:'下列句子没有语病的一项是（）',options:['A.学习成绩的提高取决于自身是否努力','B.良好的心态是考试取得好成绩的重要因素','C.能不能战胜困难是成功的关键','D.一个人是否拥有健康的体魄关键在于持之以恒地锻炼'],answer:'B',explanation:'A一面对两面，C两面一面，D两面一面',score:3},
      { id:'c138',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'否定不当',type:'choice',difficulty:'hard',question:'下列句子没有语病的一项是（）',options:['A.谁也不能否认优异的成绩不是靠勤奋得来的','B.为了防止此类事故不再发生我们必须加强管理','C.难道我们能否认学习不需要努力吗','D.我们应该珍惜时间努力学习'],answer:'D',explanation:'A三重否定，B双重否定不当，C三重否定',score:3},
      { id:'c139',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'搭配不当',type:'choice',difficulty:'medium',question:'下列句子有语病的一项是（）',options:['A.春天的公园里百花争艳美不胜收','B.通过老师的教育使我认识到了自己的错误','C.他养成了认真思考的好习惯','D.这个问题值得我们深思'],answer:'B',explanation:'B缺主语删通过或使',score:2},
      { id:'c140',subject:'chinese',chapter:'基础知识',section:'病句修改',knowledgePoint:'句式杂糅',type:'choice',difficulty:'medium',question:'下列句子有语病的一项是（）',options:['A.是因为他刻苦努力的原因所以成绩好','B.他因为刻苦努力所以成绩好','C.他成绩好的原因是他刻苦努力','D.他刻苦努力因此成绩好'],answer:'A',explanation:'A句式杂糅，是因为和的原因重复使用',score:2},
      { id:'c141',subject:'chinese',chapter:'基础知识',section:'语言运用',knowledgePoint:'句子衔接',type:'choice',difficulty:'medium',question:'填入下面横线处最恰当的一项是（）读书使人充实，__________，__________。',options:['A.讨论使人机智，作文使人准确','B.作文使人准确，讨论使人机智','C.机智来源于讨论，准确来源于作文','D.讨论和作文都使人进步'],answer:'A',explanation:'培根《谈读书》中的名句，注意原文的排比顺序',score:2},
      { id:'c142',subject:'chinese',chapter:'基础知识',section:'语言运用',knowledgePoint:'句子排序',type:'choice',difficulty:'hard',question:'下列句子排序最恰当的一项是（）①它是生命的源泉阳光②失去了希望生命就会枯萎③希望是生命的灵魂④有了希望生命就会生机勃勃',options:['A.③①②④','B.③①④②','C.①③④②','D.①③②④'],answer:'B',explanation:'③是总起句提出希望的主题，①紧接具体比喻，④正面说，②反面说',score:3},
      { id:'c143',subject:'chinese',chapter:'基础知识',section:'语言运用',knowledgePoint:'仿写句子',type:'choice',difficulty:'medium',question:'对“如果你是一朵花就给人们带来一份温馨”仿写正确的是（）',options:['A.如果你是一棵草就给人们带来一片绿色','B.如果你是太阳就要温暖大地','C.如果你是大海就要容纳百川','D.如果你是星星就要闪耀夜空'],answer:'A',explanation:'A在句式与意境上与例句最为一致',score:2},
      { id:'c144',subject:'chinese',chapter:'基础知识',section:'语言运用',knowledgePoint:'表达得体',type:'choice',difficulty:'medium',question:'下列情境中语言表达最得体的一项是（）',options:['A.对老师说：你的课上得太差了','B.对同学说：你的字写得真漂亮能教教我吗','C.对长辈说：老头让一下','D.对服务员说：喂拿菜单来'],answer:'B',explanation:'B表达了对同学的真诚赞美和虚心请教礼貌得体',score:2},
      { id:'c145',subject:'chinese',chapter:'基础知识',section:'语言运用',knowledgePoint:'句子排序',type:'choice',difficulty:'medium',question:'下列句子排序正确的一项是（）①才能真正读懂书②读书要学会思考③否则只是机械地翻阅④而不能吸收其中的营养',options:['A.②①③④','B.②③④①','C.①②③④','D.④③②①'],answer:'A',explanation:'②提出观点学会思考，①是结果，③④从反面论述',score:2},
      { id:'c146',subject:'chinese',chapter:'基础知识',section:'语言运用',knowledgePoint:'修辞手法',type:'choice',difficulty:'medium',question:'对下列句子修辞手法判断有误的一项是（）',options:['A.圆规一面愤愤的回转身一面絮絮的说——借代','B.太阳的脸红起来了——拟人','C.像这样的老师我们怎么会不喜欢她——反问','D.柏油路晒化了甚至铺户门前的铜牌好像也要晒化——比喻'],answer:'D',explanation:'D是夸张而非比喻，用不可能之事极言天气之热',score:2},
      { id:'c147',subject:'chinese',chapter:'基础知识',section:'语言运用',knowledgePoint:'句子衔接',type:'choice',difficulty:'medium',question:'填入下面横线处的句子与上下文衔接最恰当的是（）__________，你尽可流动明眸欣赏白云蓝天飞流急湍；__________，你尽可闭目凝神倾听莺歌燕语春水潺潺。',options:['A.在视觉世界中/在听觉世界里','B.在山水之间/在田野之中','C.在自然之中/在生活之中','D.在白天/在夜晚'],answer:'A',explanation:'第一空与视觉相关对应视觉世界，第二空与听觉相关对应听觉世界',score:2},
      { id:'c148',subject:'chinese',chapter:'基础知识',section:'语言运用',knowledgePoint:'标点符号',type:'choice',difficulty:'medium',question:'下列句子中标点符号使用正确的一项是（）',options:['A.我不知道他为什么没有来？','B.老师说：今天我们学习《论语》十二章。','C.他买了苹果、香蕉、和橘子。','D.这次活动我们班取得了第一名你说厉害不厉害。'],answer:'B',explanation:'A是陈述句应用句号，C顿号和连词一般不连用，D缺少问号',score:2},
      { id:'c149',subject:'chinese',chapter:'基础知识',section:'语言运用',knowledgePoint:'仿写句子',type:'fill',difficulty:'medium',question:'仿写：人们都爱秋天爱她的天高气爽爱她的云淡日丽爱她的香飘四野。人们都爱__________爱她的__________爱她的__________爱她的__________。',answer:'春天',explanation:'仿写需保持排比句式，合理即可。示例：春天万物复苏百花争艳生机勃勃',score:2},
      { id:'c150',subject:'chinese',chapter:'基础知识',section:'语言运用',knowledgePoint:'对联知识',type:'fill',difficulty:'medium',question:'对联“书山有路勤为径”的下联是：__________。',answer:'学海无涯苦作舟',explanation:'经典劝学对联平仄相对意思相承',score:2},
      { id:'c151',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'记叙要素',type:'choice',difficulty:'easy',question:'记叙文的六要素不包括（）',options:['A.时间地点人物','B.起因经过结果','C.论点论据论证','D.以上都不属于'],answer:'C',explanation:'论点论据论证是议论文的三要素',score:2},
      { id:'c152',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'记叙顺序',type:'choice',difficulty:'medium',question:'在叙述中心事件时插入一段与主要情节相关的回忆这种叙述顺序是（）',options:['A.顺叙','B.倒叙','C.插叙','D.补叙'],answer:'C',explanation:'插叙是在叙述中心事件过程中暂时中断插入一段相关回忆的叙述方式',score:2},
      { id:'c153',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'记叙人称',type:'choice',difficulty:'medium',question:'以“我”的口吻来叙述的记叙文人称是（）',options:['A.第一人称','B.第二人称','C.第三人称','D.全知视角'],answer:'A',explanation:'第一人称以我或我们的视角叙述给人真实亲切之感',score:2},
      { id:'c154',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'线索作用',type:'choice',difficulty:'medium',question:'记叙文的线索作用不包括（）',options:['A.贯穿全文','B.推动情节发展','C.表现主题','D.提供论点'],answer:'D',explanation:'提供论点是议论文的功能',score:2},
      { id:'c155',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'表达方式',type:'choice',difficulty:'medium',question:'记叙文最基本的表达方式是（）',options:['A.议论','B.描写','C.叙述','D.抒情'],answer:'C',explanation:'叙述是记叙文最基本的表达方式用来交代人物经历和事件发展过程',score:2},
      { id:'c156',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'人物描写',type:'choice',difficulty:'medium',question:'下列不属于人物描写方法的是（）',options:['A.外貌描写','B.动作描写','C.心理描写','D.景物描写'],answer:'D',explanation:'景物描写属于环境描写不属于人物描写方法',score:2},
      { id:'c157',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'环境描写',type:'choice',difficulty:'medium',question:'记叙文中环境描写的作用不包括（）',options:['A.交代故事发生的背景','B.渲染气氛','C.烘托人物心情','D.提出中心论点'],answer:'D',explanation:'提出中心论点是议论文的特征',score:2},
      { id:'c158',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'修辞赏析',type:'choice',difficulty:'medium',question:'“她的笑容像春天的阳光一样温暖”运用的修辞手法是（）',options:['A.拟人','B.比喻','C.夸张','D.借代'],answer:'B',explanation:'把笑容比作春天的阳光是比喻手法',score:2},
      { id:'c159',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'表现手法',type:'choice',difficulty:'hard',question:'“朱门酒肉臭路有冻死骨”运用的表现手法是（）',options:['A.象征','B.对比','C.衬托','D.欲扬先抑'],answer:'B',explanation:'将富贵人家的奢侈与贫苦百姓的悲惨进行鲜明对比',score:3},
      { id:'c160',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'标题作用',type:'choice',difficulty:'medium',question:'记叙文标题的作用不包括（）',options:['A.概括文章主要内容','B.作为文章线索','C.揭示文章主旨','D.代替文章结尾'],answer:'D',explanation:'标题不能代替结尾结尾有其独立的功能',score:2},
      { id:'c161',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'结尾作用',type:'choice',difficulty:'medium',question:'记叙文结尾的作用不包括（）',options:['A.总结全文','B.点明中心','C.提出新的论点','D.升华主题'],answer:'C',explanation:'提出新的论点是议论文的特征',score:2},
      { id:'c162',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'叙述顺序',type:'choice',difficulty:'medium',question:'先写事件的结果再回过头来叙述事件经过这种叙述方式是（）',options:['A.顺叙','B.倒叙','C.插叙','D.补叙'],answer:'B',explanation:'倒叙是先写结局或最突出的片段然后再按事件发展顺序进行叙述',score:2},
      { id:'c163',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'人物分析',type:'choice',difficulty:'medium',question:'分析人物形象的方法不包括（）',options:['A.分析人物的外貌语言动作心理','B.分析人物所处的环境','C.分析故事情节的发展','D.直接背诵答案'],answer:'D',explanation:'分析人物形象需要从文本出发不能靠背诵',score:2},
      { id:'c164',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'表现手法',type:'fill',difficulty:'medium',question:'先贬低再赞扬的表现手法叫做__________。',answer:'欲扬先抑',explanation:'欲扬先抑使情节多变形成波澜给读者留下深刻印象',score:2},
      { id:'c165',subject:'chinese',chapter:'现代文阅读',section:'记叙文阅读',knowledgePoint:'修辞手法',type:'fill',difficulty:'medium',question:'“桃树杏树梨树你不让我我不让你都开满了花赶趟儿”运用了__________修辞手法。',answer:'拟人',explanation:'你不让我我不让你赋予果树人的行为和情感是拟人手法',score:2},
      { id:'c166',subject:'chinese',chapter:'现代文阅读',section:'说明文阅读',knowledgePoint:'说明方法',type:'choice',difficulty:'easy',question:'“赵州桥非常雄伟全长50.82米两端宽9.6米”运用的说明方法是（）',options:['A.打比方','B.列数字','C.举例子','D.分类别'],answer:'B',explanation:'用具体数据说明赵州桥的规模是列数字的说明方法',score:2},
      { id:'c167',subject:'chinese',chapter:'现代文阅读',section:'说明文阅读',knowledgePoint:'说明方法',type:'choice',difficulty:'medium',question:'“石拱桥的桥洞成弧形就像虹”运用的说明方法是（）',options:['A.列数字','B.打比方','C.作比较','D.下定义'],answer:'B',explanation:'把桥洞比作虹是打比方的说明方法使说明生动形象',score:2},
      { id:'c168',subject:'chinese',chapter:'现代文阅读',section:'说明文阅读',knowledgePoint:'说明方法',type:'choice',difficulty:'medium',question:'“苏州园林与北京的园林不同极少使用彩绘”运用的说明方法是（）',options:['A.举例子','B.打比方','C.作比较','D.分类别'],answer:'C',explanation:'将苏州园林与北京园林对比说明是作比较的说明方法',score:2},
      { id:'c169',subject:'chinese',chapter:'现代文阅读',section:'说明文阅读',knowledgePoint:'说明顺序',type:'choice',difficulty:'medium',question:'介绍一座建筑物的结构布局通常使用的说明顺序是（）',options:['A.时间顺序','B.空间顺序','C.逻辑顺序','D.程序顺序'],answer:'B',explanation:'空间顺序适用于介绍建筑物从上到下从外到内等方位顺序',score:2},
      { id:'c170',subject:'chinese',chapter:'现代文阅读',section:'说明文阅读',knowledgePoint:'说明顺序',type:'choice',difficulty:'medium',question:'说明事物的发展变化过程通常采用（）',options:['A.时间顺序','B.空间顺序','C.逻辑顺序','D.倒叙'],answer:'A',explanation:'时间顺序适用于说明事物的发展变化过程',score:2},
      { id:'c171',subject:'chinese',chapter:'现代文阅读',section:'说明文阅读',knowledgePoint:'说明语言',type:'choice',difficulty:'medium',question:'说明文语言的基本特点是（）',options:['A.生动形象','B.准确严密','C.含蓄委婉','D.夸张华丽'],answer:'B',explanation:'准确性和严密性是说明文语言的基本特点',score:2},
      { id:'c172',subject:'chinese',chapter:'现代文阅读',section:'说明文阅读',knowledgePoint:'说明语言',type:'choice',difficulty:'medium',question:'“大拱的两肩上各有两个小拱”中“各”字的作用是（）',options:['A.使语言更生动','B.使说明更准确','C.使语言更优美','D.使结构更完整'],answer:'B',explanation:'各字准确说明了大拱两肩小拱的数量和分布',score:2},
      { id:'c173',subject:'chinese',chapter:'现代文阅读',section:'说明文阅读',knowledgePoint:'说明文类型',type:'choice',difficulty:'medium',question:'按照说明对象划分《中国石拱桥》属于（）',options:['A.事理说明文','B.事物说明文','C.科普说明文','D.科技说明文'],answer:'B',explanation:'事物说明文以具体事物为说明对象介绍其特征和功能',score:2},
      { id:'c174',subject:'chinese',chapter:'现代文阅读',section:'说明文阅读',knowledgePoint:'说明方法',type:'fill',difficulty:'medium',question:'用简明的语言对事物的本质特征作概括说明的方法叫做__________。',answer:'下定义',explanation:'下定义是说明文中揭示事物本质特征的说明方法',score:2},
      { id:'c175',subject:'chinese',chapter:'现代文阅读',section:'说明文阅读',knowledgePoint:'说明方法',type:'fill',difficulty:'medium',question:'对事物进行解释说明的说明方法叫做__________。',answer:'作诠释',explanation:'作诠释是对事物进行解释说明的一种说明方法',score:2},
      { id:'c176',subject:'chinese',chapter:'现代文阅读',section:'议论文阅读',knowledgePoint:'论证方法',type:'choice',difficulty:'medium',question:'用确凿典型的事实来证明论点的方法是（）',options:['A.道理论证','B.举例论证','C.比喻论证','D.对比论证'],answer:'B',explanation:'举例论证是用具体事例来证明论点的方法',score:2},
      { id:'c177',subject:'chinese',chapter:'现代文阅读',section:'议论文阅读',knowledgePoint:'论证方法',type:'choice',difficulty:'medium',question:'“知识就是力量”这句话作为论据属于（）',options:['A.事实论据','B.道理论据','C.比喻论据','D.对比论据'],answer:'B',explanation:'培根的名言属于道理论据引用名人名言来证明论点',score:2},
      { id:'c178',subject:'chinese',chapter:'现代文阅读',section:'议论文阅读',knowledgePoint:'议论文结构',type:'choice',difficulty:'medium',question:'议论文最基本的结构是（）',options:['A.提出问题—分析问题—解决问题','B.总—分','C.分—总','D.并列式'],answer:'A',explanation:'引论—本论—结论是议论文最基本的结构模式',score:2},
      { id:'c179',subject:'chinese',chapter:'现代文阅读',section:'议论文阅读',knowledgePoint:'论点判定',type:'choice',difficulty:'medium',question:'下列关于论点的说法正确的是（）',options:['A.论点就是文章的标题','B.一篇文章只能有一个中心论点','C.论点不能出现在文章开头','D.论点必须是疑问句'],answer:'B',explanation:'一篇议论文只有一个中心论点可以有多个分论点',score:2},
      { id:'c180',subject:'chinese',chapter:'现代文阅读',section:'议论文阅读',knowledgePoint:'论证方法',type:'fill',difficulty:'medium',question:'议论文的三要素是：__________、__________、__________。',answer:'论点',explanation:'议论文三要素：论点论据论证',score:2},
      { id:'c181',subject:'chinese',chapter:'作文基础',section:'审题立意',knowledgePoint:'审题方法',type:'choice',difficulty:'medium',question:'审题时首先要做的是（）',options:['A.确定文体','B.抓住题目的关键词','C.想好开头','D.确定字数'],answer:'B',explanation:'抓住关键词是审题的第一步有助于准确把握题目的核心要求',score:2},
      { id:'c182',subject:'chinese',chapter:'作文基础',section:'审题立意',knowledgePoint:'审题方法',type:'choice',difficulty:'medium',question:'对于命题作文《我的老师》审题时需要注意的重点是（）',options:['A.写字数','B.写一个我熟悉的有特点的老师','C.写所有老师','D.写名人传记'],answer:'B',explanation:'我和老师是关键限定：要写自己亲身接触的老师突出个性特点',score:2},
      { id:'c183',subject:'chinese',chapter:'作文基础',section:'审题立意',knowledgePoint:'立意技巧',type:'choice',difficulty:'medium',question:'立意的基本要求不包括（）',options:['A.正确','B.深刻','C.新颖','D.冗长'],answer:'D',explanation:'立意要求正确深刻新颖集中冗长不是好文章的标准',score:2},
      { id:'c184',subject:'chinese',chapter:'作文基础',section:'审题立意',knowledgePoint:'立意技巧',type:'choice',difficulty:'medium',question:'以小见大的写作手法是指（）',options:['A.写小事不写大事','B.通过小事反映大主题','C.只写细节','D.写很多人'],answer:'B',explanation:'以小见大即从小事小物入手挖掘出深刻的社会或人生主题',score:2},
      { id:'c185',subject:'chinese',chapter:'作文基础',section:'审题立意',knowledgePoint:'审题方法',type:'choice',difficulty:'medium',question:'对于半命题作文__________的滋味横线上最适合填的是（）',options:['A.一个词语','B.一个句子','C.一个段落','D.一篇短文'],answer:'A',explanation:'半命题作文横线处通常填一个词语或短语作为标题的组成部分',score:2},
      { id:'c186',subject:'chinese',chapter:'作文基础',section:'审题立意',knowledgePoint:'立意技巧',type:'choice',difficulty:'medium',question:'下列立意中最新颖的是（）',options:['A.写母爱的伟大从母亲的白发写起','B.照搬范文的立意','C.写一件大家都写过的事','D.重复别人说过的话'],answer:'A',explanation:'从细节切入既有真情实感又角度独特具有新颖性',score:2},
      { id:'c187',subject:'chinese',chapter:'作文基础',section:'审题立意',knowledgePoint:'审题方法',type:'choice',difficulty:'medium',question:'话题作文与命题作文最大的区别是（）',options:['A.话题作文不需要标题','B.话题作文可自拟标题选材范围更广','C.话题作文不能写记叙文','D.话题作文必须写议论文'],answer:'B',explanation:'话题作文只给出话题范围标题和立意角度由考生自定更自由',score:2},
      { id:'c188',subject:'chinese',chapter:'作文基础',section:'审题立意',knowledgePoint:'立意技巧',type:'fill',difficulty:'medium',question:'立意要做到“人人心中有个个笔下无”强调的是立意的__________。',answer:'新颖',explanation:'强调立意要有独创性不能人云亦云',score:2},
      { id:'c189',subject:'chinese',chapter:'作文基础',section:'审题立意',knowledgePoint:'审题方法',type:'fill',difficulty:'medium',question:'审题时要明确题目的限制条件这叫做审清__________。',answer:'题眼',explanation:'题眼是题目中的关键词揭示了写作的重点和方向',score:2},
      { id:'c190',subject:'chinese',chapter:'作文基础',section:'审题立意',knowledgePoint:'审题方法',type:'fill',difficulty:'medium',question:'材料作文的第一步是__________材料把握材料的核心意思。',answer:'读懂',explanation:'材料作文首先要读懂材料准确把握材料的中心思想和寓意',score:2},
      { id:'c191',subject:'chinese',chapter:'作文基础',section:'写作手法',knowledgePoint:'表达方式',type:'choice',difficulty:'medium',question:'下列不属于五种表达方式的是（）',options:['A.叙述','B.描写','C.议论','D.说明方法'],answer:'D',explanation:'五种表达方式为：叙述描写议论抒情说明。说明方法是说明文的写作手法',score:2},
      { id:'c192',subject:'chinese',chapter:'作文基础',section:'写作手法',knowledgePoint:'结构手法',type:'choice',difficulty:'medium',question:'文章开头直接点明主题的写法叫做（）',options:['A.设置悬念','B.开门见山','C.欲扬先抑','D.卒章显志'],answer:'B',explanation:'开门见山即在文章开头就直接点题使读者一目了然',score:2},
      { id:'c193',subject:'chinese',chapter:'作文基础',section:'写作手法',knowledgePoint:'结构手法',type:'choice',difficulty:'medium',question:'在文章结尾才点明主旨的写法叫做（）',options:['A.开门见山','B.卒章显志','C.承上启下','D.前后照应'],answer:'B',explanation:'卒章显志即在文章结尾时才点明主题或表达中心思想',score:2},
      { id:'c194',subject:'chinese',chapter:'作文基础',section:'写作手法',knowledgePoint:'修辞手法',type:'choice',difficulty:'medium',question:'下列不属于修辞手法的是（）',options:['A.比喻','B.拟人','C.排比','D.顺叙'],answer:'D',explanation:'顺叙是叙述顺序属于文章结构方式不是修辞手法',score:2},
      { id:'c195',subject:'chinese',chapter:'作文基础',section:'写作手法',knowledgePoint:'表达方式',type:'choice',difficulty:'medium',question:'记叙文中穿插议论的作用是（）',options:['A.增加字数','B.画龙点睛深化主题','C.使文章混乱','D.纯粹装饰'],answer:'B',explanation:'记叙中穿插恰当的议论可以点明意义深化主题升华情感',score:2},
      { id:'c196',subject:'chinese',chapter:'作文基础',section:'写作手法',knowledgePoint:'结构手法',type:'choice',difficulty:'medium',question:'文章段落之间过渡自然的结构方式叫做（）',options:['A.承上启下','B.卒章显志','C.开门见山','D.首尾呼应'],answer:'A',explanation:'承上启下指文章段落之间的过渡衔接使文章结构严谨',score:2},
      { id:'c197',subject:'chinese',chapter:'作文基础',section:'写作手法',knowledgePoint:'描写手法',type:'choice',difficulty:'medium',question:'下列描写手法中属于直接描写人物内心活动的是（）',options:['A.外貌描写','B.动作描写','C.心理描写','D.环境描写'],answer:'C',explanation:'心理描写直接揭示人物的内心世界和思想活动',score:2},
      { id:'c198',subject:'chinese',chapter:'作文基础',section:'写作手法',knowledgePoint:'结构手法',type:'choice',difficulty:'medium',question:'文章开头和结尾相互呼应的写法叫做（）',options:['A.承上启下','B.卒章显志','C.首尾呼应','D.开门见山'],answer:'C',explanation:'首尾呼应使文章结构完整中心突出给读者以浑然一体之感',score:2},
      { id:'c199',subject:'chinese',chapter:'作文基础',section:'写作手法',knowledgePoint:'表现手法',type:'fill',difficulty:'medium',question:'通过具体事物来表现某种抽象意义或精神品质的手法叫做__________。',answer:'象征',explanation:'象征是用具体事物暗示特定人物或事理以表达真挚感情和深刻寓意',score:2},
      { id:'c200',subject:'chinese',chapter:'作文基础',section:'写作手法',knowledgePoint:'表现手法',type:'fill',difficulty:'medium',question:'不直接说出要说的事物而借用与它有密切关系的事物来代替这叫做__________。',answer:'借代',explanation:'借代是用相关事物代替所要表达的人或事物使表达更生动形象',score:2}
    ],
  },
  chemistry: {
    preview: [
      // ========== 一、物质的变化和性质 (15题: h01-h20，含h05) ==========
      { id:'h01',subject:'chemistry',chapter:'物质的变化和性质',section:'物理变化和化学变化',knowledgePoint:'变化类型判断',type:'choice',difficulty:'easy',question:'下列属于化学变化的是（）',options:['A.冰雪融化','B.酒精挥发','C.铁钉生锈','D.玻璃破碎'],answer:'C',explanation:'铁钉生锈生成新物质（铁锈），是化学变化；冰雪融化（水状态改变）、酒精挥发（液态变气态）、玻璃破碎（形状改变）都没有新物质生成，属于物理变化',score:2 },
      { id:'h05',subject:'chemistry',chapter:'物质的变化和性质',section:'分子和原子',knowledgePoint:'分子运动',type:'choice',difficulty:'easy',question:'闻到花香说明分子（）',options:['A.有质量','B.在不断运动','C.体积很小','D.可以再分'],answer:'B',explanation:'花香分子不断运动扩散到空气中，被嗅觉感受器捕捉',score:2 },
      { id:'h08',subject:'chemistry',chapter:'物质的变化和性质',section:'物理变化和化学变化',knowledgePoint:'物理变化判断',type:'choice',difficulty:'easy',question:'下列变化属于物理变化的是（）',options:['A.食物腐败','B.水结成冰','C.蜡烛燃烧','D.铁锅生锈'],answer:'B',explanation:'水结成冰只是状态改变，没有新物质生成，属于物理变化；食物腐败、蜡烛燃烧、铁锅生锈都生成了新物质',score:2 },
      { id:'h09',subject:'chemistry',chapter:'物质的变化和性质',section:'物理变化和化学变化',knowledgePoint:'化学变化伴随现象',type:'choice',difficulty:'easy',question:'化学变化中常常伴随的现象不包括（）',options:['A.发光放热','B.产生气体','C.颜色改变','D.状态改变'],answer:'D',explanation:'状态改变（如熔化、蒸发、凝固）是物理变化的典型特征，不是化学变化的本质现象',score:2 },
      { id:'h10',subject:'chemistry',chapter:'物质的变化和性质',section:'物质的性质',knowledgePoint:'化学性质判断',type:'choice',difficulty:'easy',question:'下列描述属于氧气化学性质的是（）',options:['A.无色无味','B.密度比空气略大','C.支持燃烧','D.不易溶于水'],answer:'C',explanation:'支持燃烧（助燃性）需要发生化学变化才能表现出来，属于化学性质；颜色、密度、溶解性属于物理性质',score:2 },
      { id:'h11',subject:'chemistry',chapter:'物质的变化和性质',section:'物质的性质',knowledgePoint:'物理性质判断',type:'choice',difficulty:'easy',question:'下列描述属于物理性质的是（）',options:['A.铜是紫红色固体','B.铁丝在潮湿空气中会生锈','C.纸张能燃烧','D.食物容易腐烂'],answer:'A',explanation:'颜色不需要发生化学变化就能表现出来，属于物理性质；生锈、燃烧、腐烂都涉及化学变化',score:2 },
      { id:'h12',subject:'chemistry',chapter:'物质的变化和性质',section:'物理变化和化学变化',knowledgePoint:'变化类型综合判断',type:'choice',difficulty:'medium',question:'"蜡炬成灰泪始干"中涉及的变化是（）',options:['A.只有物理变化','B.只有化学变化','C.既有物理变化又有化学变化','D.没有发生变化'],answer:'C',explanation:'蜡烛熔化是物理变化（固体变液体），蜡烛燃烧生成CO₂和H₂O是化学变化，二者同时发生',score:2 },
      { id:'h13',subject:'chemistry',chapter:'物质的变化和性质',section:'物理变化和化学变化',knowledgePoint:'燃烧与化学变化',type:'choice',difficulty:'easy',question:'下列过程中一定发生化学变化的是（）',options:['A.蒸发','B.燃烧','C.升华','D.熔化'],answer:'B',explanation:'燃烧是可燃物与氧气发生的发光放热的剧烈氧化反应，一定生成新物质；蒸发、升华、熔化都是物理变化',score:2 },
      { id:'h14',subject:'chemistry',chapter:'物质的变化和性质',section:'分子和原子',knowledgePoint:'分子的概念',type:'choice',difficulty:'medium',question:'下列关于分子的说法，正确的是（）',options:['A.分子是保持物质化学性质的最小粒子','B.分子在化学变化中不可再分','C.所有物质都由分子构成','D.分子是静止不动的'],answer:'A',explanation:'分子是保持物质化学性质的最小粒子；在化学变化中分子可以再分为原子；并非所有物质都由分子构成（如金属由原子构成）',score:2 },
      { id:'h15',subject:'chemistry',chapter:'物质的变化和性质',section:'物理变化和化学变化',knowledgePoint:'变化本质区别',type:'choice',difficulty:'medium',question:'物理变化和化学变化的本质区别是（）',options:['A.是否有颜色变化','B.是否有气体产生','C.是否有新物质生成','D.是否发光放热'],answer:'C',explanation:'是否有新物质生成是判断物理变化和化学变化的根本依据，颜色变化、气体产生、发光放热都不是本质区别',score:2 },
      { id:'h16',subject:'chemistry',chapter:'物质的变化和性质',section:'物理变化和化学变化',knowledgePoint:'物理变化判断',type:'choice',difficulty:'easy',question:'下列变化属于物理变化的是（）',options:['A.汽油挥发','B.牛奶变酸','C.火药爆炸','D.钢铁生锈'],answer:'A',explanation:'汽油挥发是液态变为气态，没有新物质生成；牛奶变酸（发酵）、火药爆炸、钢铁生锈都生成了新物质',score:2 },
      { id:'h17',subject:'chemistry',chapter:'物质的变化和性质',section:'物质的性质',knowledgePoint:'化学性质判断',type:'choice',difficulty:'easy',question:'下列性质中，属于化学性质的是（）',options:['A.导电性','B.延展性','C.挥发性','D.可燃性'],answer:'D',explanation:'可燃性需要通过燃烧这一化学变化才能表现出来；导电性、延展性、挥发性都是物理性质',score:2 },
      { id:'h18',subject:'chemistry',chapter:'物质的变化和性质',section:'分子和原子',knowledgePoint:'分子间有间隔',type:'choice',difficulty:'easy',question:'50mL酒精和50mL水混合后总体积小于100mL，这说明（）',options:['A.分子间有间隔','B.分子在不断运动','C.分子很小','D.分子可以再分'],answer:'A',explanation:'混合后体积减小是因为分子间有间隔，酒精分子和水分子互相填充到对方分子间的空隙中',score:2 },
      { id:'h19',subject:'chemistry',chapter:'物质的变化和性质',section:'物理变化和化学变化',knowledgePoint:'变化关系辨析',type:'choice',difficulty:'medium',question:'下列关于物质变化的说法，正确的是（）',options:['A.有气体产生的变化一定是化学变化','B.化学变化中一定伴随物理变化','C.发光放热的变化一定是化学变化','D.物理变化中一定伴随化学变化'],answer:'B',explanation:'化学变化过程中往往同时发生物理变化（如蜡烛燃烧时蜡先熔化）；但有气体（如水的沸腾）、发光放热（如灯泡发光）不一定是化学变化',score:2 },
      { id:'h20',subject:'chemistry',chapter:'物质的变化和性质',section:'分子和原子',knowledgePoint:'物理变化与化学变化的微观本质',type:'choice',difficulty:'hard',question:'水蒸发和水电解两种变化的本质区别是（）',options:['A.前者吸收热量，后者吸收热量','B.前者水分子本身没变，后者水分子变成了新分子','C.前者不需要条件，后者需要通电','D.前者有气体产生，后者没有气体产生'],answer:'B',explanation:'水蒸发是物理变化，水分子本身没有改变，只是分子间隔变大；水电解是化学变化，水分子变成了氢分子和氧分子',score:3 },

      // ========== 二、空气和氧气 (20题: h02-h03, h21-h38) ==========
      { id:'h02',subject:'chemistry',chapter:'空气和氧气',section:'空气的组成',knowledgePoint:'空气成分',type:'choice',difficulty:'easy',question:'空气中体积分数约占21%的气体是（）',options:['A.氮气','B.氧气','C.二氧化碳','D.稀有气体'],answer:'B',explanation:'空气中氧气约占总体积的21%，氮气约占78%，稀有气体约占0.94%，二氧化碳约占0.03%',score:2 },
      { id:'h03',subject:'chemistry',chapter:'空气和氧气',section:'氧气的性质',knowledgePoint:'氧气的检验',type:'choice',difficulty:'easy',question:'检验氧气的最简单方法是（）',options:['A.闻气味','B.看颜色','C.用带火星的木条伸入瓶中','D.倒入澄清石灰水'],answer:'C',explanation:'氧气能使带火星的木条复燃，这是检验氧气最简便有效的方法',score:2 },
      { id:'h21',subject:'chemistry',chapter:'空气和氧气',section:'空气的组成',knowledgePoint:'空气各成分含量',type:'choice',difficulty:'easy',question:'空气中体积分数最大的气体是（）',options:['A.氮气','B.氧气','C.二氧化碳','D.水蒸气'],answer:'A',explanation:'空气中氮气约占78%，是含量最多的气体；其次氧气约占21%',score:2 },
      { id:'h22',subject:'chemistry',chapter:'空气和氧气',section:'空气的组成',knowledgePoint:'稀有气体用途',type:'choice',difficulty:'easy',question:'常用于制作霓虹灯的气体是（）',options:['A.氮气','B.氧气','C.稀有气体','D.二氧化碳'],answer:'C',explanation:'稀有气体通电时会发出不同颜色的光，可用于制作霓虹灯',score:2 },
      { id:'h23',subject:'chemistry',chapter:'空气和氧气',section:'空气的污染与保护',knowledgePoint:'空气污染物',type:'choice',difficulty:'easy',question:'下列物质中，不属于空气污染物的是（）',options:['A.二氧化硫','B.一氧化碳','C.可吸入颗粒物','D.二氧化碳'],answer:'D',explanation:'二氧化碳是空气的正常成分之一，目前未被列入空气污染物；SO₂、CO、可吸入颗粒物（PM2.5/PM10）都是常见空气污染物',score:2 },
      { id:'h24',subject:'chemistry',chapter:'空气和氧气',section:'氧气的性质',knowledgePoint:'氧气的物理性质',type:'choice',difficulty:'easy',question:'下列关于氧气物理性质的描述，错误的是（）',options:['A.通常状况下为无色气体','B.密度比空气略大','C.不易溶于水','D.极易溶于水'],answer:'D',explanation:'氧气不易溶于水（室温下1体积水约溶解0.03体积氧气），不是极易溶于水',score:2 },
      { id:'h25',subject:'chemistry',chapter:'空气和氧气',section:'氧气的性质',knowledgePoint:'硫在氧气中燃烧',type:'choice',difficulty:'medium',question:'硫在氧气中燃烧时，火焰呈现的颜色是（）',options:['A.淡蓝色','B.黄色','C.明亮的蓝紫色','D.白色'],answer:'C',explanation:'硫在空气中燃烧发出淡蓝色火焰，在纯氧气中燃烧发出明亮的蓝紫色火焰，生成有刺激性气味的SO₂',score:2 },
      { id:'h26',subject:'chemistry',chapter:'空气和氧气',section:'氧气的性质',knowledgePoint:'铁在氧气中燃烧',type:'choice',difficulty:'medium',question:'铁丝在氧气中燃烧的现象是（）',options:['A.火星四射，生成黑色固体','B.发出白光，生成白色固体','C.产生大量白烟','D.发出蓝紫色火焰'],answer:'A',explanation:'铁丝在氧气中剧烈燃烧，火星四射，放出大量热，生成黑色固体四氧化三铁（Fe₃O₄）',score:2 },
      { id:'h27',subject:'chemistry',chapter:'空气和氧气',section:'氧气的性质',knowledgePoint:'氧气的化学性质',type:'choice',difficulty:'easy',question:'下列关于氧气化学性质的叙述，正确的是（）',options:['A.氧气的化学性质很不活泼','B.氧气的化学性质比较活泼','C.氧气不能与非金属反应','D.氧气是一种可燃气体'],answer:'B',explanation:'氧气化学性质比较活泼，能与许多金属和非金属发生反应；氧气是助燃性气体（支持燃烧），本身不能燃烧',score:2 },
      { id:'h28',subject:'chemistry',chapter:'空气和氧气',section:'氧气的制取',knowledgePoint:'催化剂的概念',type:'choice',difficulty:'easy',question:'下列关于催化剂的说法，正确的是（）',options:['A.催化剂都能加快化学反应速率','B.催化剂在化学反应前后质量会减少','C.催化剂能改变化学反应速率','D.不使用催化剂反应就无法进行'],answer:'C',explanation:'催化剂能改变（加快或减慢）反应速率，本身的质量和化学性质在反应前后不变；催化剂不是反应的必需条件',score:2 },
      { id:'h29',subject:'chemistry',chapter:'空气和氧气',section:'氧气的制取',knowledgePoint:'过氧化氢制氧气',type:'choice',difficulty:'easy',question:'用过氧化氢溶液制取氧气时加入二氧化锰，其作用是（）',options:['A.增加氧气的产量','B.催化作用','C.吸收水分','D.除去杂质'],answer:'B',explanation:'二氧化锰是过氧化氢分解的催化剂，起催化作用，能加快H₂O₂的分解速率，但不改变生成氧气的量',score:2 },
      { id:'h30',subject:'chemistry',chapter:'空气和氧气',section:'氧气的制取',knowledgePoint:'高锰酸钾制氧气',type:'choice',difficulty:'easy',question:'用高锰酸钾制取氧气时，试管口要略向下倾斜，其目的是（）',options:['A.防止冷凝水倒流炸裂试管','B.使产生的气体更快导出','C.便于观察实验现象','D.防止药品滑落'],answer:'A',explanation:'加热时药品中可能存在的水分会蒸发，在试管口冷凝成水滴，若不向下倾斜，水滴倒流回灼热的试管底部会引起试管炸裂',score:2 },
      { id:'h31',subject:'chemistry',chapter:'空气和氧气',section:'氧气的用途',knowledgePoint:'氧气的用途',type:'choice',difficulty:'easy',question:'下列不属于氧气用途的是（）',options:['A.医疗急救','B.气割气焊','C.潜水呼吸','D.充入霓虹灯'],answer:'D',explanation:'充入霓虹灯的是稀有气体；医疗急救、气割气焊、潜水呼吸都是利用氧气供给呼吸或支持燃烧的性质',score:2 },
      { id:'h32',subject:'chemistry',chapter:'空气和氧气',section:'氧气的性质',knowledgePoint:'化合反应',type:'choice',difficulty:'easy',question:'下列反应中，属于化合反应的是（）',options:['A.铁丝在氧气中燃烧','B.过氧化氢分解制氧气','C.高锰酸钾加热制氧气','D.电解水'],answer:'A',explanation:'化合反应是"多变一"：铁+氧气→四氧化三铁（3Fe+2O₂→Fe₃O₄）；B、C、D都是"一变多"的分解反应',score:2 },
      { id:'h33',subject:'chemistry',chapter:'空气和氧气',section:'氧气的性质',knowledgePoint:'氧化反应',type:'choice',difficulty:'medium',question:'下列关于氧化反应的说法，正确的是（）',options:['A.氧化反应一定是化合反应','B.物质与氧发生的反应属于氧化反应','C.氧化反应必须有氧气参加','D.氧化反应都是剧烈的'],answer:'B',explanation:'物质与氧发生的反应叫氧化反应（"氧"不一定是氧气）；缓慢氧化如铁生锈也是氧化反应但不剧烈；氧化反应不一定是化合反应',score:2 },
      { id:'h34',subject:'chemistry',chapter:'空气和氧气',section:'空气的组成',knowledgePoint:'氮气的性质和用途',type:'choice',difficulty:'easy',question:'食品包装中常充入氮气防腐，利用的是氮气的（）',options:['A.密度比空气小','B.化学性质不活泼','C.无色无味','D.难溶于水'],answer:'B',explanation:'氮气化学性质稳定（不活泼），可用作保护气，防止食品被氧化变质',score:2 },
      { id:'h35',subject:'chemistry',chapter:'空气和氧气',section:'空气的污染与保护',knowledgePoint:'保护空气',type:'choice',difficulty:'easy',question:'下列做法不利于保护空气的是（）',options:['A.植树造林','B.使用清洁能源','C.大量焚烧秸秆','D.减少私家车出行'],answer:'C',explanation:'大量焚烧秸秆会产生大量烟尘和有害气体（如CO、SO₂等），严重污染空气；A、B、D都是保护空气的有效措施',score:2 },
      { id:'h36',subject:'chemistry',chapter:'空气和氧气',section:'空气的组成',knowledgePoint:'测定空气中氧气含量',type:'choice',difficulty:'hard',question:'用红磷燃烧测定空气中氧气含量的实验中，进入集气瓶的水的体积约占瓶内容积的（）',options:['A.1/2','B.1/5','C.1/3','D.全部'],answer:'B',explanation:'空气中氧气约占总体积的1/5，红磷燃烧消耗了瓶内氧气，瓶内气压减小，外界大气压将水压入瓶中，进入水的体积约等于消耗氧气的体积',score:3 },
      { id:'h37',subject:'chemistry',chapter:'空气和氧气',section:'氧气的制取',knowledgePoint:'分解反应',type:'choice',difficulty:'easy',question:'下列反应中，属于分解反应的是（）',options:['A.木炭在氧气中燃烧','B.硫在氧气中燃烧','C.加热高锰酸钾','D.红磷在氧气中燃烧'],answer:'C',explanation:'分解反应是"一变多"：高锰酸钾加热→锰酸钾+二氧化锰+氧气；A、B、D都是化合反应（多变一）',score:2 },
      { id:'h38',subject:'chemistry',chapter:'空气和氧气',section:'氧气的制取',knowledgePoint:'氧气的收集方法',type:'choice',difficulty:'hard',question:'实验室收集较纯净的氧气，最好采用的方法是（）',options:['A.向上排空气法','B.排水法','C.向下排空气法','D.直接收集'],answer:'B',explanation:'排水法收集的气体较纯净（排空气法收集的气体可能混有空气）；氧气不易溶于水且不与水反应，可用排水法收集',score:3 },

      // ========== 三、水和溶液 (15题: h04, h39-h52) ==========
      { id:'h04',subject:'chemistry',chapter:'水和溶液',section:'水的组成',knowledgePoint:'电解水',type:'choice',difficulty:'medium',question:'电解水时，正极产生的气体是（）',options:['A.氢气','B.氧气','C.氮气','D.二氧化碳'],answer:'B',explanation:'电解水口诀"正氧负氢"：与电源正极相连的电极产生氧气，与负极相连的电极产生氢气',score:2 },
      { id:'h39',subject:'chemistry',chapter:'水和溶液',section:'水的组成',knowledgePoint:'电解水-负极产物',type:'choice',difficulty:'easy',question:'电解水时，与电源负极相连的电极上产生的气体是（）',options:['A.氢气','B.氧气','C.氮气','D.水蒸气'],answer:'A',explanation:'电解水口诀"正氧负氢"，负极产生氢气，正极产生氧气',score:2 },
      { id:'h40',subject:'chemistry',chapter:'水和溶液',section:'水的组成',knowledgePoint:'电解水-气体体积比',type:'choice',difficulty:'medium',question:'电解水实验中，正极和负极产生气体的体积比约为（）',options:['A.2:1','B.1:1','C.1:2','D.2:3'],answer:'C',explanation:'电解水产生的氢气（负极）和氧气（正极）的体积比约为2:1，即正极:负极=1:2',score:2 },
      { id:'h41',subject:'chemistry',chapter:'水和溶液',section:'水的组成',knowledgePoint:'水的组成结论',type:'choice',difficulty:'medium',question:'电解水实验证明水是由（）',options:['A.氢元素和氧元素组成的','B.氢气和氧气组成的','C.氢原子和氧原子组成的','D.一个氢分子和一个氧分子组成的'],answer:'A',explanation:'电解水生成氢气和氧气，根据化学反应前后元素种类不变，可证明水由氢元素和氧元素组成',score:2 },
      { id:'h42',subject:'chemistry',chapter:'水和溶液',section:'溶液的形成',knowledgePoint:'溶液的概念',type:'choice',difficulty:'easy',question:'下列关于溶液的说法，正确的是（）',options:['A.溶液都是无色的','B.溶液一定是液体','C.溶液是均一、稳定的混合物','D.溶液中只能有一种溶质'],answer:'C',explanation:'溶液是均一、稳定的混合物；溶液可以有颜色（如硫酸铜溶液为蓝色），可以含有多种溶质，合金也是溶液（固态溶液）',score:2 },
      { id:'h43',subject:'chemistry',chapter:'水和溶液',section:'溶液的形成',knowledgePoint:'溶质和溶剂',type:'choice',difficulty:'easy',question:'食盐水中，溶质是（）',options:['A.食盐','B.水','C.食盐水','D.氯化钠和水都是'],answer:'A',explanation:'食盐水中食盐（NaCl）是被溶解的物质，是溶质；水是溶解溶质的物质，是溶剂',score:2 },
      { id:'h44',subject:'chemistry',chapter:'水和溶液',section:'溶液的形成',knowledgePoint:'溶剂判断',type:'choice',difficulty:'easy',question:'碘酒溶液中，溶剂是（）',options:['A.碘','B.酒精','C.水','D.碘和酒精'],answer:'B',explanation:'碘酒是碘溶于酒精形成的溶液，其中碘是溶质，酒精是溶剂',score:2 },
      { id:'h45',subject:'chemistry',chapter:'水和溶液',section:'溶解度',knowledgePoint:'溶解度的概念',type:'choice',difficulty:'medium',question:'固体物质的溶解度是指在一定的温度下，该物质在（）达到饱和状态时所溶解的质量',options:['A.100g溶剂中','B.100g溶液中','C.100mL溶剂中','D.100mL溶液中'],answer:'A',explanation:'溶解度定义：在一定温度下，某固态物质在100g溶剂里达到饱和状态时所溶解的质量（单位为克）',score:2 },
      { id:'h46',subject:'chemistry',chapter:'水和溶液',section:'溶解度',knowledgePoint:'温度对溶解度的影响',type:'choice',difficulty:'easy',question:'大多数固体物质的溶解度随温度升高而（）',options:['A.增大','B.减小','C.不变','D.先增大后减小'],answer:'A',explanation:'大多数固体物质的溶解度随温度升高而增大（如KNO₃）；但熟石灰Ca(OH)₂等少数物质例外，溶解度随温度升高而减小',score:2 },
      { id:'h47',subject:'chemistry',chapter:'水和溶液',section:'水的净化',knowledgePoint:'硬水和软水',type:'choice',difficulty:'easy',question:'区别硬水和软水，可加入的试剂是（）',options:['A.食盐水','B.肥皂水','C.石灰水','D.稀盐酸'],answer:'B',explanation:'硬水中加入肥皂水产生泡沫少、浮渣多；软水中加入肥皂水产生泡沫多',score:2 },
      { id:'h48',subject:'chemistry',chapter:'水和溶液',section:'水的净化',knowledgePoint:'净化方法比较',type:'choice',difficulty:'easy',question:'下列净水方法中，净化程度最高的是（）',options:['A.沉淀','B.过滤','C.吸附','D.蒸馏'],answer:'D',explanation:'蒸馏得到的是纯净水（蒸馏水），净化程度最高；沉淀、过滤、吸附都不能除去水中的可溶性杂质',score:2 },
      { id:'h49',subject:'chemistry',chapter:'水和溶液',section:'水的净化',knowledgePoint:'过滤操作',type:'choice',difficulty:'medium',question:'过滤操作中，玻璃棒的作用是（）',options:['A.搅拌','B.捣碎固体','C.引流','D.转移固体'],answer:'C',explanation:'过滤时玻璃棒用于引流，使待过滤的液体沿玻璃棒缓缓流入漏斗中，防止液体飞溅',score:2 },
      { id:'h50',subject:'chemistry',chapter:'水和溶液',section:'溶液的形成',knowledgePoint:'溶液的特征',type:'choice',difficulty:'easy',question:'下列关于溶液特征的描述，正确的是（）',options:['A.溶液都是无色透明的','B.溶液都是均一、稳定的','C.溶液都是液体状态','D.溶液都是纯净物'],answer:'B',explanation:'溶液的基本特征是均一性和稳定性；溶液不一定无色（如硫酸铜溶液呈蓝色），也不一定为液态（如合金是固态溶液），溶液是混合物不是纯净物',score:2 },
      { id:'h51',subject:'chemistry',chapter:'水和溶液',section:'溶解度',knowledgePoint:'溶解度曲线',type:'choice',difficulty:'hard',question:'关于固体物质溶解度的说法，错误的是（）',options:['A.大多数固体物质溶解度随温度升高而增大','B.少数固体物质溶解度受温度影响很小','C.极少数固体物质溶解度随温度升高而减小','D.所有固体物质溶解度都随温度升高而增大'],answer:'D',explanation:'Ca(OH)₂的溶解度随温度升高而减小，NaCl的溶解度受温度影响很小，并非所有固体物质都随温度升高溶解度增大',score:3 },
      { id:'h52',subject:'chemistry',chapter:'水和溶液',section:'溶解度',knowledgePoint:'饱和溶液与不饱和溶液',type:'choice',difficulty:'hard',question:'将接近饱和的硝酸钾溶液变为饱和溶液，不可行的方法是（）',options:['A.降低温度','B.蒸发溶剂','C.加入硝酸钾固体','D.增加溶剂'],answer:'D',explanation:'增加溶剂会使溶液更加不饱和；降低温度（KNO₃溶解度随温度降低而减小）、蒸发溶剂、加入溶质都可以使不饱和溶液变为饱和',score:3 },

      // ========== 四、碳和碳的氧化物 (15题: h07, h53-h66) ==========
      { id:'h07',subject:'chemistry',chapter:'碳和碳的氧化物',section:'二氧化碳',knowledgePoint:'CO₂检验',type:'choice',difficulty:'easy',question:'检验二氧化碳的方法是（）',options:['A.用带火星木条','B.倒入澄清石灰水','C.点燃','D.观察颜色'],answer:'B',explanation:'CO₂能使澄清石灰水变浑浊（生成CaCO₃白色沉淀），这是检验CO₂的特征反应',score:2 },
      { id:'h53',subject:'chemistry',chapter:'碳和碳的氧化物',section:'二氧化碳',knowledgePoint:'CO₂的物理性质',type:'choice',difficulty:'easy',question:'下列关于二氧化碳物理性质的描述，正确的是（）',options:['A.密度比空气小','B.无色无味的液体','C.密度比空气大','D.极易溶于水'],answer:'C',explanation:'CO₂是无色无味的气体，密度比空气大（约为空气密度的1.5倍），能溶于水但不是极易溶',score:2 },
      { id:'h54',subject:'chemistry',chapter:'碳和碳的氧化物',section:'二氧化碳',knowledgePoint:'CO₂不支持燃烧',type:'choice',difficulty:'easy',question:'将燃着的木条伸入盛有二氧化碳的集气瓶中，木条会（）',options:['A.燃烧更旺','B.熄灭','C.没有变化','D.发生爆炸'],answer:'B',explanation:'CO₂既不能燃烧也不能支持燃烧，燃着的木条在CO₂中会熄灭，利用这一性质可用于灭火',score:2 },
      { id:'h55',subject:'chemistry',chapter:'碳和碳的氧化物',section:'二氧化碳',knowledgePoint:'CO₂的用途',type:'choice',difficulty:'easy',question:'下列不属于二氧化碳用途的是（）',options:['A.灭火','B.制碳酸饮料','C.光合作用的原料','D.供给呼吸'],answer:'D',explanation:'CO₂不能供给呼吸；CO₂可用于灭火（密度大且不支持燃烧）、制汽水（CO₂溶于水）、作光合作用的原料',score:2 },
      { id:'h56',subject:'chemistry',chapter:'碳和碳的氧化物',section:'二氧化碳',knowledgePoint:'CO₂与水反应',type:'choice',difficulty:'medium',question:'将CO₂通入紫色石蕊溶液中，溶液变红，这是因为CO₂与水反应生成了（）',options:['A.一氧化碳','B.碳酸','C.碳酸钙','D.碳酸氢钠'],answer:'B',explanation:'CO₂+H₂O=H₂CO₃（碳酸），碳酸显酸性，能使紫色石蕊溶液变红',score:2 },
      { id:'h57',subject:'chemistry',chapter:'碳和碳的氧化物',section:'二氧化碳的制取',knowledgePoint:'实验室制CO₂的药品',type:'choice',difficulty:'medium',question:'实验室制取二氧化碳常用的药品是（）',options:['A.石灰石（或大理石）和稀盐酸','B.石灰石和稀硫酸','C.木炭在氧气中燃烧','D.碳酸钠和稀盐酸'],answer:'A',explanation:'石灰石（主要成分CaCO₃）和稀盐酸反应速率适中，适合实验室制取；稀硫酸与石灰石反应生成微溶CaSO₄覆盖表面阻碍反应继续',score:2 },
      { id:'h58',subject:'chemistry',chapter:'碳和碳的氧化物',section:'二氧化碳的制取',knowledgePoint:'CO₂的收集方法',type:'choice',difficulty:'medium',question:'收集二氧化碳通常用向上排空气法，这是因为二氧化碳（）',options:['A.有刺激性气味','B.密度比空气大','C.能溶于水','D.能灭火'],answer:'B',explanation:'CO₂密度比空气大，可用向上排空气法收集；CO₂能溶于水且与水反应，一般不用排水法收集',score:2 },
      { id:'h59',subject:'chemistry',chapter:'碳和碳的氧化物',section:'二氧化碳',knowledgePoint:'CO₂的检验方法',type:'choice',difficulty:'medium',question:'检验某种气体是否为二氧化碳，应使用（）',options:['A.带火星的木条','B.澄清石灰水','C.燃着的木条','D.紫色石蕊溶液'],answer:'B',explanation:'CO₂能使澄清石灰水变浑浊（Ca(OH)₂+CO₂=CaCO₃↓+H₂O），这是检验CO₂的常用特征方法；燃着的木条只能证明气体不支持燃烧',score:2 },
      { id:'h60',subject:'chemistry',chapter:'碳和碳的氧化物',section:'一氧化碳',knowledgePoint:'CO的性质',type:'choice',difficulty:'medium',question:'下列关于一氧化碳的说法，错误的是（）',options:['A.一氧化碳有刺激性气味','B.一氧化碳有毒','C.一氧化碳难溶于水','D.一氧化碳具有可燃性'],answer:'A',explanation:'一氧化碳是无色无味的气体（不是有刺激性气味的），剧毒，难溶于水，具有可燃性（燃烧产生蓝色火焰）',score:2 },
      { id:'h61',subject:'chemistry',chapter:'碳和碳的氧化物',section:'碳的单质',knowledgePoint:'碳的单质',type:'choice',difficulty:'easy',question:'下列物质中，不属于碳单质的是（）',options:['A.金刚石','B.石墨','C.C₆₀','D.大理石'],answer:'D',explanation:'大理石的主要成分是CaCO₃，属于化合物（碳酸盐），不是碳单质；金刚石、石墨、C₆₀（足球烯）都是由碳元素组成的不同单质',score:2 },
      { id:'h62',subject:'chemistry',chapter:'碳和碳的氧化物',section:'碳的单质',knowledgePoint:'金刚石和石墨',type:'choice',difficulty:'medium',question:'金刚石和石墨物理性质差异很大的根本原因是（）',options:['A.碳原子的排列方式不同','B.组成元素不同','C.原子大小不同','D.分子结构不同'],answer:'A',explanation:'金刚石和石墨都是由碳元素组成的单质，但由于碳原子的排列方式不同（金刚石是正四面体网状结构，石墨是层状结构），导致物理性质差异很大',score:2 },
      { id:'h63',subject:'chemistry',chapter:'碳和碳的氧化物',section:'二氧化碳',knowledgePoint:'温室效应',type:'choice',difficulty:'easy',question:'引起温室效应的最主要气体是（）',options:['A.氮气','B.二氧化碳','C.氧气','D.稀有气体'],answer:'B',explanation:'CO₂是引起温室效应的主要气体；此外甲烷（CH₄）、臭氧（O₃）等也能引起温室效应',score:2 },
      { id:'h64',subject:'chemistry',chapter:'碳和碳的氧化物',section:'碳的单质',knowledgePoint:'碳的化学性质',type:'choice',difficulty:'easy',question:'古代书法家、画家的字画能保存至今而不褪色，说明碳在常温下（）',options:['A.能与氧气反应','B.能与水反应','C.能与酸反应','D.化学性质稳定'],answer:'D',explanation:'碳在常温下化学性质稳定（不活泼），不易与其他物质反应，所以用墨（炭黑）书写的字画能长期保存',score:2 },
      { id:'h65',subject:'chemistry',chapter:'碳和碳的氧化物',section:'二氧化碳的制取',knowledgePoint:'制取装置选择',type:'choice',difficulty:'hard',question:'实验室制取CO₂的发生装置，与制取下列哪种气体的装置相似（）',options:['A.高锰酸钾加热制氧气','B.过氧化氢和二氧化锰制氧气','C.电解水制氢气','D.加热氯酸钾制氧气'],answer:'B',explanation:'制取CO₂（石灰石+稀盐酸，固+液不加热）和过氧化氢制O₂（H₂O₂+MnO₂，固+液不加热）都属于"固液不加热型"，发生装置相似',score:3 },
      { id:'h66',subject:'chemistry',chapter:'碳和碳的氧化物',section:'二氧化碳',knowledgePoint:'CO₂与石灰水的反应',type:'choice',difficulty:'hard',question:'将CO₂通入紫色石蕊溶液中，溶液变红；再将溶液加热，溶液又变回紫色。这是因为（）',options:['A.CO₂从溶液中逸出了','B.石蕊失效了','C.碳酸不稳定，受热分解了','D.CO₂与石蕊发生反应了'],answer:'C',explanation:'CO₂与水反应生成的H₂CO₃（碳酸）不稳定，受热分解为CO₂和H₂O（H₂CO₃=CO₂↑+H₂O），溶液酸性消失，变回紫色',score:3 },

      // ========== 五、燃料和燃烧 (10题: h67-h76) ==========
      { id:'h67',subject:'chemistry',chapter:'燃料和燃烧',section:'燃烧的条件',knowledgePoint:'燃烧的三个条件',type:'choice',difficulty:'easy',question:'燃烧需要三个条件，下列不属于燃烧条件的是（）',options:['A.可燃物','B.与空气（或氧气）接触','C.温度达到着火点','D.有光照射'],answer:'D',explanation:'燃烧需要三个条件同时满足：可燃物、与氧气（或空气）接触、温度达到着火点；光照不是燃烧的必要条件',score:2 },
      { id:'h68',subject:'chemistry',chapter:'燃料和燃烧',section:'灭火的原理',knowledgePoint:'灭火原理',type:'choice',difficulty:'easy',question:'用灯帽盖灭酒精灯，其灭火原理是（）',options:['A.隔绝氧气（空气）','B.降低温度','C.清除可燃物','D.降低着火点'],answer:'A',explanation:'灯帽盖灭是利用隔绝空气（氧气）的原理灭火；着火点是物质的固有属性，不能降低',score:2 },
      { id:'h69',subject:'chemistry',chapter:'燃料和燃烧',section:'燃烧的条件',knowledgePoint:'着火点的概念',type:'choice',difficulty:'easy',question:'下列关于"着火点"的说法，正确的是（）',options:['A.着火点可以通过浇水来降低','B.着火点是物质的一种固有属性','C.水能灭火是因为降低了可燃物的着火点','D.不同物质的着火点都相同'],answer:'B',explanation:'着火点是物质固有的属性，一般不改变；水灭火的主要原理是降温（使温度降到着火点以下）和隔绝空气，不是降低着火点本身',score:2 },
      { id:'h70',subject:'chemistry',chapter:'燃料和燃烧',section:'灭火的原理',knowledgePoint:'灭火方法',type:'choice',difficulty:'medium',question:'炒菜时油锅着火，最佳的灭火方法是（）',options:['A.用水浇','B.用嘴吹','C.盖上锅盖','D.端走油锅'],answer:'C',explanation:'盖上锅盖利用隔绝空气的原理灭火；油锅着火不能用水浇，因为油的密度比水小，会浮在水面上继续燃烧，甚至造成火势蔓延',score:2 },
      { id:'h71',subject:'chemistry',chapter:'燃料和燃烧',section:'化石燃料',knowledgePoint:'化石燃料的种类',type:'choice',difficulty:'easy',question:'下列不属于化石燃料的是（）',options:['A.煤','B.石油','C.天然气','D.酒精'],answer:'D',explanation:'煤、石油、天然气是三大化石燃料（不可再生能源）；酒精（乙醇）可由植物发酵制得，属于可再生能源',score:2 },
      { id:'h72',subject:'chemistry',chapter:'燃料和燃烧',section:'燃料的合理利用',knowledgePoint:'燃料充分燃烧的条件',type:'choice',difficulty:'medium',question:'使燃料充分燃烧通常考虑两点：一是要有足够的空气，二是（）',options:['A.燃料要纯净','B.燃料与空气要有足够大的接触面积','C.燃料要干燥','D.要在密闭容器中燃烧'],answer:'B',explanation:'燃料充分燃烧需要：充足的氧气（空气）和足够大的接触面积（如将煤做成蜂窝状增大与空气的接触面）',score:2 },
      { id:'h73',subject:'chemistry',chapter:'燃料和燃烧',section:'化石燃料',knowledgePoint:'天然气的成分',type:'choice',difficulty:'easy',question:'天然气的主要成分是（）',options:['A.甲烷','B.一氧化碳','C.氢气','D.乙醇'],answer:'A',explanation:'天然气的主要成分是甲烷（CH₄），甲烷是最简单的有机物',score:2 },
      { id:'h74',subject:'chemistry',chapter:'燃料和燃烧',section:'燃烧的条件',knowledgePoint:'缓慢氧化',type:'choice',difficulty:'medium',question:'下列变化中，属于缓慢氧化的是（）',options:['A.木炭在空气中燃烧','B.火药急速爆炸','C.汽油挥发','D.钢铁生锈'],answer:'D',explanation:'钢铁生锈是铁与氧气、水发生的缓慢氧化反应，反应速率慢、无明显发光现象；A和B是剧烈氧化，C（汽油挥发）是物理变化',score:2 },
      { id:'h75',subject:'chemistry',chapter:'燃料和燃烧',section:'能源的利用',knowledgePoint:'新能源',type:'choice',difficulty:'easy',question:'下列能源中，属于新能源的是（）',options:['A.煤','B.石油','C.天然气','D.太阳能'],answer:'D',explanation:'太阳能是新能源（可再生能源，清洁无污染）；煤、石油、天然气属于传统化石燃料（不可再生）',score:2 },
      { id:'h76',subject:'chemistry',chapter:'燃料和燃烧',section:'燃烧与灭火综合',knowledgePoint:'燃烧与灭火原理辨析',type:'choice',difficulty:'hard',question:'下列成语或俗语中，涉及化学原理分析正确的是（）',options:['A."釜底抽薪"——利用隔绝氧气的灭火原理','B."煽风点火"——是为了增大可燃物的着火点','C."钻木取火"——利用摩擦生热使温度达到可燃物的着火点','D.可燃物只要接触氧气就能燃烧'],answer:'C',explanation:'钻木取火是通过摩擦生热提高温度，使温度达到木材的着火点；"釜底抽薪"是清除可燃物（不是隔绝氧气）；着火点不能改变；燃烧还需要温度达到着火点',score:3 },

      // ========== 六、金属和金属材料 (15题: h77-h91) ==========
      { id:'h77',subject:'chemistry',chapter:'金属和金属材料',section:'金属的物理性质',knowledgePoint:'金属的物理通性',type:'choice',difficulty:'easy',question:'下列不属于金属物理通性的是（）',options:['A.有金属光泽','B.能导电导热','C.有延展性','D.熔点都很高'],answer:'D',explanation:'并非所有金属熔点都高，如汞（水银）常温下为液态，熔点为-39℃，是熔点很低的金属',score:2 },
      { id:'h78',subject:'chemistry',chapter:'金属和金属材料',section:'金属材料',knowledgePoint:'地壳中金属元素含量',type:'choice',difficulty:'easy',question:'地壳中含量最高的金属元素是（）',options:['A.铁','B.铝','C.钙','D.钠'],answer:'B',explanation:'地壳中含量最多的金属元素是铝（Al），约占7.73%；其次是铁（Fe）约占4.75%',score:2 },
      { id:'h79',subject:'chemistry',chapter:'金属和金属材料',section:'金属材料',knowledgePoint:'合金的概念',type:'choice',difficulty:'easy',question:'下列关于合金的说法，正确的是（）',options:['A.合金是纯净物','B.合金中只含有金属元素','C.合金是混合物','D.合金的硬度比组成它的纯金属小'],answer:'C',explanation:'合金是在金属中加热熔合某些金属或非金属制得的具有金属特征的混合物；合金的硬度一般比组成它的纯金属大，熔点一般比组成金属低',score:2 },
      { id:'h80',subject:'chemistry',chapter:'金属和金属材料',section:'金属材料',knowledgePoint:'生铁和钢的区别',type:'choice',difficulty:'easy',question:'生铁和钢的主要区别在于（）',options:['A.含碳量不同','B.组成元素完全不同','C.颜色不同','D.是否含有铁元素'],answer:'A',explanation:'生铁和钢都是铁碳合金，主要区别是含碳量不同：生铁含碳量2%~4.3%，钢含碳量0.03%~2%',score:2 },
      { id:'h81',subject:'chemistry',chapter:'金属和金属材料',section:'金属的化学性质',knowledgePoint:'金属与酸反应',type:'choice',difficulty:'medium',question:'下列金属中，不能与稀盐酸反应生成氢气的是（）',options:['A.镁','B.锌','C.铁','D.铜'],answer:'D',explanation:'在金属活动性顺序中，铜排在氢（H）之后，不能置换出酸中的氢；镁、锌、铁排在氢之前，能与稀盐酸反应产生H₂',score:2 },
      { id:'h82',subject:'chemistry',chapter:'金属和金属材料',section:'金属的化学性质',knowledgePoint:'置换反应',type:'choice',difficulty:'medium',question:'铁放入硫酸铜溶液中，发生反应的化学方程式为（）',options:['A.3Fe+2CuSO₄=Fe₃(SO₄)₂+2Cu','B.Fe+CuSO₄=FeSO₄+Cu','C.Fe+CuSO₄=FeCu+SO₄','D.Fe+2CuSO₄=Fe(SO₄)₂+2Cu'],answer:'B',explanation:'铁与硫酸铜溶液发生置换反应：Fe+CuSO₄=FeSO₄+Cu，铁将铜从溶液中置换出来，生成FeSO₄（Fe为+2价）',score:2 },
      { id:'h83',subject:'chemistry',chapter:'金属和金属材料',section:'金属的化学性质',knowledgePoint:'铁与酸反应',type:'choice',difficulty:'easy',question:'将铁片放入稀盐酸中，观察到的现象是（）',options:['A.溶液变为蓝色','B.有气泡产生，溶液逐渐变为浅绿色','C.无明显现象','D.铁片表面变黑'],answer:'B',explanation:'Fe+2HCl=FeCl₂+H₂↑，铁片表面有气泡产生（H₂），溶液逐渐变为浅绿色（Fe²⁺的颜色）',score:2 },
      { id:'h84',subject:'chemistry',chapter:'金属和金属材料',section:'金属的化学性质',knowledgePoint:'金属活动性顺序验证',type:'choice',difficulty:'medium',question:'要验证Fe、Cu、Ag三种金属的活动性顺序，下列试剂组合可行的是（）',options:['A.Fe、Cu、Ag分别放入稀盐酸中','B.Fe、Cu分别放入AgNO₃溶液中','C.Fe丝、CuSO₄溶液、Ag丝','D.Ag丝、CuSO₄溶液、Fe丝'],answer:'C',explanation:'Fe能与CuSO₄反应置换出Cu，说明Fe>Cu；Ag不能与CuSO₄反应，说明Cu>Ag；由此可得活动性：Fe>Cu>Ag',score:2 },
      { id:'h85',subject:'chemistry',chapter:'金属和金属材料',section:'金属资源的保护',knowledgePoint:'铁锈的主要成分',type:'choice',difficulty:'easy',question:'铁锈的主要成分是（）',options:['A.FeO','B.Fe₃O₄','C.Fe₂O₃','D.FeCl₃'],answer:'C',explanation:'铁锈的主要成分是氧化铁（Fe₂O₃），是铁与空气中的氧气和水共同作用的结果，铁锈疏松多孔，不能阻止内部铁继续生锈',score:2 },
      { id:'h86',subject:'chemistry',chapter:'金属和金属材料',section:'金属资源的保护',knowledgePoint:'防锈措施',type:'choice',difficulty:'easy',question:'在铁制品表面涂油可以防锈，其原理是（）',options:['A.保持铁制品表面干燥','B.隔绝氧气和水','C.改变铁的内部结构','D.降低铁的着火点'],answer:'B',explanation:'涂油在铁制品表面形成一层保护膜，隔绝了空气中的氧气和水，从而防止铁生锈',score:2 },
      { id:'h87',subject:'chemistry',chapter:'金属和金属材料',section:'金属资源的利用',knowledgePoint:'工业炼铁原理',type:'choice',difficulty:'medium',question:'工业炼铁（高炉炼铁）的主要原理是（）',options:['A.用一氧化碳还原铁的氧化物','B.加热铁矿石使其熔化','C.电解铁的氧化物','D.用氢气还原铁的氧化物'],answer:'A',explanation:'高炉炼铁原理：用焦炭产生的CO作还原剂，在高温下将铁的氧化物（主要是Fe₂O₃）还原为铁：Fe₂O₃+3CO=2Fe+3CO₂',score:2 },
      { id:'h88',subject:'chemistry',chapter:'金属和金属材料',section:'金属材料',knowledgePoint:'金属材料的范围',type:'choice',difficulty:'easy',question:'下列材料中，属于金属材料的是（）',options:['A.塑料','B.铝合金','C.陶瓷','D.玻璃'],answer:'B',explanation:'金属材料包括纯金属和合金两大类；铝合金是合金，属于金属材料；塑料是有机合成材料，陶瓷和玻璃属于无机非金属材料',score:2 },
      { id:'h89',subject:'chemistry',chapter:'金属和金属材料',section:'金属资源的保护',knowledgePoint:'保护金属资源',type:'choice',difficulty:'easy',question:'保护金属资源的有效途径不包括（）',options:['A.防止金属锈蚀','B.回收利用废旧金属','C.寻找金属的代用品','D.大量开采金属矿物'],answer:'D',explanation:'大量开采金属矿物会加速金属资源的消耗，不利于保护；防止锈蚀、回收利用、寻找代用品都是保护金属资源的有效途径',score:2 },
      { id:'h90',subject:'chemistry',chapter:'金属和金属材料',section:'金属的化学性质',knowledgePoint:'金属与盐溶液反应',type:'choice',difficulty:'hard',question:'将洁净的铁丝插入硝酸银溶液中，可观察到的现象是（）',options:['A.铁丝表面有银白色固体析出，溶液由无色逐渐变为浅绿色','B.铁丝表面有气泡产生','C.无明显现象','D.铁丝逐渐溶解消失'],answer:'A',explanation:'Fe+2AgNO₃=Fe(NO₃)₂+2Ag，铁将银从溶液中置换出来，银白色固体（Ag）附着在铁丝表面，生成的Fe(NO₃)₂使溶液呈浅绿色',score:3 },
      { id:'h91',subject:'chemistry',chapter:'金属和金属材料',section:'金属的化学性质',knowledgePoint:'金属与酸反应的计算',type:'choice',difficulty:'hard',question:'质量相同的下列金属分别与足量稀盐酸完全反应，产生氢气最多的是（）',options:['A.Mg','B.Al','C.Fe','D.Zn'],answer:'B',explanation:'产生H₂的质量由金属的化合价与相对原子质量的比值决定：Mg(24,+2)→H₂比为12:1，Al(27,+3)→H₂比为9:1，Fe(56,+2)→H₂比为28:1，Zn(65,+2)→H₂比为32.5:1，比值越小产H₂越多，Al产H₂最多',score:3 },

      // ========== 七、酸碱盐基础 (25题: h92-h116) ==========
      { id:'h92',subject:'chemistry',chapter:'酸碱盐',section:'酸碱指示剂',knowledgePoint:'石蕊变色',type:'choice',difficulty:'easy',question:'紫色石蕊溶液遇酸性溶液变为（）',options:['A.红色','B.蓝色','C.无色','D.紫色不变'],answer:'A',explanation:'紫色石蕊遇酸变红，遇碱变蓝，在中性溶液中呈紫色',score:2 },
      { id:'h93',subject:'chemistry',chapter:'酸碱盐',section:'酸碱指示剂',knowledgePoint:'酚酞变色',type:'choice',difficulty:'easy',question:'向氢氧化钠溶液中滴入无色酚酞溶液，溶液变为（）',options:['A.红色','B.蓝色','C.黄色','D.绿色'],answer:'A',explanation:'无色酚酞遇碱变红色，NaOH是碱，所以溶液变红；酚酞遇酸和中性溶液不变色',score:2 },
      { id:'h94',subject:'chemistry',chapter:'酸碱盐',section:'常见的酸和碱',knowledgePoint:'物质分类-酸',type:'choice',difficulty:'easy',question:'下列物质中，属于酸的是（）',options:['A.NaCl','B.NaOH','C.HCl','D.H₂O'],answer:'C',explanation:'HCl（盐酸/氯化氢）在水溶液中解离出的阳离子全部是H⁺，属于酸；NaCl是盐，NaOH是碱，H₂O是氧化物',score:2 },
      { id:'h95',subject:'chemistry',chapter:'酸碱盐',section:'常见的酸和碱',knowledgePoint:'物质分类-碱',type:'choice',difficulty:'easy',question:'下列物质中，属于碱的是（）',options:['A.Na₂CO₃','B.Ca(OH)₂','C.HCl','D.CO₂'],answer:'B',explanation:'Ca(OH)₂（氢氧化钙）在水溶液中解离出的阴离子全部是OH⁻，属于碱；Na₂CO₃是盐，HCl是酸，CO₂是氧化物',score:2 },
      { id:'h96',subject:'chemistry',chapter:'酸碱盐',section:'溶液的酸碱度',knowledgePoint:'pH与中性',type:'choice',difficulty:'easy',question:'pH=7的溶液呈（）',options:['A.酸性','B.碱性','C.中性','D.无法判断'],answer:'C',explanation:'pH是表示溶液酸碱度的指标：pH=7为中性，pH<7为酸性，pH>7为碱性',score:2 },
      { id:'h97',subject:'chemistry',chapter:'酸碱盐',section:'溶液的酸碱度',knowledgePoint:'pH与酸性',type:'choice',difficulty:'easy',question:'某溶液的pH=3，则该溶液呈（）',options:['A.酸性','B.碱性','C.中性','D.无法判断'],answer:'A',explanation:'pH<7呈酸性，pH=3<7，该溶液呈酸性且酸性较强',score:2 },
      { id:'h98',subject:'chemistry',chapter:'酸碱盐',section:'溶液的酸碱度',knowledgePoint:'pH的测定方法',type:'choice',difficulty:'easy',question:'测定溶液pH最简便的方法是（）',options:['A.用石蕊溶液','B.用pH试纸','C.用酚酞溶液','D.闻气味'],answer:'B',explanation:'pH试纸可以快速简便地测出溶液的近似pH值；石蕊和酚酞只能判断溶液的酸碱性，不能测出具体pH数值',score:2 },
      { id:'h99',subject:'chemistry',chapter:'酸碱盐',section:'中和反应',knowledgePoint:'中和反应的实质',type:'choice',difficulty:'medium',question:'酸碱中和反应的实质是（）',options:['A.H⁺与Na⁺结合','B.H⁺与OH⁻结合生成水','C.酸和碱混合在一起','D.生成盐和水'],answer:'B',explanation:'中和反应的实质是酸中的H⁺与碱中的OH⁻结合生成H₂O：H⁺+OH⁻=H₂O；生成盐只是表现现象',score:2 },
      { id:'h100',subject:'chemistry',chapter:'酸碱盐',section:'常见的酸和碱',knowledgePoint:'盐酸',type:'choice',difficulty:'easy',question:'人体胃液中含有帮助消化的酸，其主要成分是（）',options:['A.盐酸','B.硫酸','C.硝酸','D.醋酸'],answer:'A',explanation:'胃液中含有盐酸（HCl），帮助消化食物并杀灭病菌',score:2 },
      { id:'h101',subject:'chemistry',chapter:'酸碱盐',section:'常见的酸和碱',knowledgePoint:'浓硫酸的稀释',type:'choice',difficulty:'medium',question:'稀释浓硫酸时，正确的操作是（）',options:['A.将水倒入浓硫酸中','B.将浓硫酸沿器壁慢慢注入水中，并用玻璃棒不断搅拌','C.将水和浓硫酸同时倒入烧杯中混合','D.以上方法都可以'],answer:'B',explanation:'稀释浓硫酸时要"酸入水、沿器壁、不断搅拌"——将浓硫酸沿容器壁缓缓注入水中，并用玻璃棒不断搅拌散热，防止液体沸腾溅出伤人',score:2 },
      { id:'h102',subject:'chemistry',chapter:'酸碱盐',section:'常见的酸和碱',knowledgePoint:'氢氧化钠的俗称',type:'choice',difficulty:'easy',question:'氢氧化钠的俗称是（）',options:['A.纯碱','B.小苏打','C.烧碱','D.熟石灰'],answer:'C',explanation:'NaOH俗称烧碱、火碱、苛性钠；纯碱是Na₂CO₃（碳酸钠），小苏打是NaHCO₃（碳酸氢钠），熟石灰是Ca(OH)₂（氢氧化钙）',score:2 },
      { id:'h103',subject:'chemistry',chapter:'酸碱盐',section:'常见的酸和碱',knowledgePoint:'氢氧化钙的俗称',type:'choice',difficulty:'easy',question:'熟石灰的化学式是（）',options:['A.CaO','B.CaCO₃','C.Ca(OH)₂','D.CaCl₂'],answer:'C',explanation:'熟石灰（也叫消石灰）是Ca(OH)₂；CaO是生石灰，CaCO₃是石灰石和大理石的主要成分',score:2 },
      { id:'h104',subject:'chemistry',chapter:'酸碱盐',section:'常见的盐',knowledgePoint:'碳酸钠的俗称',type:'choice',difficulty:'easy',question:'纯碱（苏打）的化学式是（）',options:['A.NaOH','B.Na₂CO₃','C.NaHCO₃','D.NaCl'],answer:'B',explanation:'纯碱（苏打）是Na₂CO₃；NaOH是烧碱（火碱），NaHCO₃是小苏打，NaCl是食盐',score:2 },
      { id:'h105',subject:'chemistry',chapter:'酸碱盐',section:'常见的盐',knowledgePoint:'碳酸氢钠',type:'choice',difficulty:'easy',question:'小苏打的化学式是（）',options:['A.Na₂CO₃','B.NaOH','C.CaCO₃','D.NaHCO₃'],answer:'D',explanation:'小苏打是NaHCO₃（碳酸氢钠），受热分解能产生CO₂，可用于发酵和灭火',score:2 },
      { id:'h106',subject:'chemistry',chapter:'酸碱盐',section:'常见的盐',knowledgePoint:'盐的概念',type:'choice',difficulty:'easy',question:'下列物质中，属于盐的是（）',options:['A.H₂SO₄','B.NaOH','C.NaCl','D.H₂O'],answer:'C',explanation:'NaCl（氯化钠/食盐）是由金属离子（Na⁺）和酸根离子（Cl⁻）构成的化合物，属于盐；H₂SO₄是酸，NaOH是碱，H₂O是氧化物',score:2 },
      { id:'h107',subject:'chemistry',chapter:'酸碱盐',section:'酸碱指示剂',knowledgePoint:'石蕊变色与pH的关系',type:'choice',difficulty:'medium',question:'能使紫色石蕊溶液变蓝的溶液，其pH（）',options:['A.大于7','B.小于7','C.等于7','D.无法确定'],answer:'A',explanation:'紫色石蕊遇碱变蓝，碱性溶液的pH大于7',score:2 },
      { id:'h108',subject:'chemistry',chapter:'酸碱盐',section:'溶液的酸碱度',knowledgePoint:'pH大小比较',type:'choice',difficulty:'medium',question:'下列溶液中，pH最小的是（）',options:['A.肥皂水','B.食盐水','C.柠檬汁','D.石灰水'],answer:'C',explanation:'柠檬汁含柠檬酸，呈酸性，pH<7且较小；肥皂水（碱性）和石灰水（碱性）pH>7，食盐水pH≈7（中性）',score:2 },
      { id:'h109',subject:'chemistry',chapter:'酸碱盐',section:'中和反应',knowledgePoint:'中和反应的应用',type:'choice',difficulty:'medium',question:'用熟石灰改良酸性土壤，利用的原理是（）',options:['A.化合反应','B.分解反应','C.置换反应','D.中和反应'],answer:'D',explanation:'熟石灰Ca(OH)₂是碱，与土壤中的酸性物质发生中和反应，降低土壤酸性',score:2 },
      { id:'h110',subject:'chemistry',chapter:'酸碱盐',section:'常见的酸和碱',knowledgePoint:'浓硫酸的特性',type:'choice',difficulty:'medium',question:'浓硫酸不具有的性质是（）',options:['A.吸水性','B.脱水性','C.强腐蚀性','D.挥发性'],answer:'D',explanation:'浓硫酸有吸水性（可用于干燥气体）、脱水性（能使有机物炭化）、强腐蚀性，但没有挥发性；浓盐酸才具有挥发性',score:2 },
      { id:'h111',subject:'chemistry',chapter:'酸碱盐',section:'常见的酸和碱',knowledgePoint:'氢氧化钠的保存',type:'choice',difficulty:'medium',question:'氢氧化钠固体必须密封保存，原因是它容易（）',options:['A.挥发','B.潮解并与空气中的CO₂反应而变质','C.升华','D.燃烧'],answer:'B',explanation:'NaOH易吸收空气中的水分而潮解（表面变湿），同时与空气中的CO₂反应生成Na₂CO₃而变质：2NaOH+CO₂=Na₂CO₃+H₂O',score:2 },
      { id:'h112',subject:'chemistry',chapter:'酸碱盐',section:'常见的酸和碱',knowledgePoint:'酸的化学性质',type:'choice',difficulty:'easy',question:'酸具有相似化学性质的原因是酸在水溶液中都能解离出（）',options:['A.H⁺','B.OH⁻','C.H₂O分子','D.酸根离子'],answer:'A',explanation:'酸在水溶液中都能解离出H⁺（氢离子），因此酸具有相似的化学性质（如能使石蕊变红、能与活泼金属反应等）',score:2 },
      { id:'h113',subject:'chemistry',chapter:'酸碱盐',section:'常见的酸和碱',knowledgePoint:'碱的化学性质',type:'choice',difficulty:'easy',question:'碱溶液具有相似化学性质的原因是碱溶液中都含有（）',options:['A.H⁺','B.OH⁻','C.金属离子','D.O²⁻'],answer:'B',explanation:'碱在水溶液中都能解离出OH⁻（氢氧根离子），因此碱溶液具有相似的化学性质（如能使酚酞变红、能与酸反应等）',score:2 },
      { id:'h114',subject:'chemistry',chapter:'酸碱盐',section:'中和反应',knowledgePoint:'中和反应的反应类型',type:'choice',difficulty:'medium',question:'酸碱中和反应所属的基本反应类型是（）',options:['A.化合反应','B.分解反应','C.复分解反应','D.置换反应'],answer:'C',explanation:'中和反应（酸+碱→盐+水）是两种化合物互相交换成分生成另外两种化合物的反应，属于复分解反应',score:2 },
      { id:'h115',subject:'chemistry',chapter:'酸碱盐',section:'酸碱指示剂',knowledgePoint:'酚酞遇酸不变色',type:'choice',difficulty:'easy',question:'向稀盐酸中滴入无色酚酞溶液，溶液的颜色（）',options:['A.变为红色','B.变为蓝色','C.变为紫色','D.不变色（仍为无色）'],answer:'D',explanation:'无色酚酞遇酸和中性溶液均不变色（仍为无色），只有遇碱才变为红色；稀盐酸是酸，所以酚酞不变色',score:2 },
      { id:'h116',subject:'chemistry',chapter:'酸碱盐',section:'常见的盐',knowledgePoint:'碳酸盐与酸的反应',type:'choice',difficulty:'hard',question:'热水瓶胆内常附有水垢（主要成分是CaCO₃），除去水垢可选用（）',options:['A.食盐水','B.石灰水','C.食醋','D.酒精'],answer:'C',explanation:'食醋中含醋酸（CH₃COOH），能与CaCO₃反应生成可溶性盐、CO₂和水：CaCO₃+2CH₃COOH=(CH₃COO)₂Ca+H₂O+CO₂↑',score:3 },

      // ========== 八、化学方程式 (15题: h06, h117-h130) ==========
      { id:'h06',subject:'chemistry',chapter:'化学方程式',section:'质量守恒定律',knowledgePoint:'质量守恒定律',type:'choice',difficulty:'medium',question:'化学反应前后一定不变的是（）',options:['A.分子种类','B.分子数目','C.原子种类和数目','D.物质的状态'],answer:'C',explanation:'化学反应的实质是分子分裂为原子、原子重新组合成新分子。在此过程中，原子的种类、数目和质量都不变，所以化学反应前后各物质的质量总和相等',score:2 },
      { id:'h117',subject:'chemistry',chapter:'化学方程式',section:'化学方程式的意义',knowledgePoint:'化学方程式提供的信息',type:'choice',difficulty:'easy',question:'化学方程式不能提供的信息是（）',options:['A.反应物和生成物是什么','B.反应发生的条件','C.各物质之间的质量比','D.化学反应的快慢'],answer:'D',explanation:'化学方程式可以表示反应物、生成物、反应条件和各物质间的质量比（或粒子个数比），但不能表示化学反应的速率',score:2 },
      { id:'h118',subject:'chemistry',chapter:'化学方程式',section:'质量守恒定律',knowledgePoint:'质量守恒的微观解释',type:'choice',difficulty:'easy',question:'化学反应前后一定不变的是（）①原子种类 ②分子种类 ③原子数目 ④分子数目 ⑤原子质量',options:['A.①②③','B.①③⑤','C.②④','D.③④⑤'],answer:'B',explanation:'化学反应前后不变的"三不变"：原子种类不变、原子数目不变、原子质量不变（即元素种类和质量不变）；改变的"两改变"：分子种类改变、物质种类改变',score:2 },
      { id:'h119',subject:'chemistry',chapter:'化学方程式',section:'化学方程式的书写',knowledgePoint:'化学方程式的配平依据',type:'choice',difficulty:'easy',question:'配平化学方程式的依据是（）',options:['A.质量守恒定律','B.能量守恒定律','C.元素周期律','D.阿伏伽德罗定律'],answer:'A',explanation:'配平化学方程式的依据是质量守恒定律——反应前后各原子的种类和数目必须相等',score:2 },
      { id:'h120',subject:'chemistry',chapter:'化学方程式',section:'化学方程式的书写',knowledgePoint:'方程式正误判断',type:'choice',difficulty:'easy',question:'下列化学方程式中，书写正确的是（）',options:['A.4Fe+3O₂=2Fe₂O₃','B.Mg+O₂=MgO₂','C.2H₂+O₂=点燃=2H₂O','D.S+O₂点燃SO₂↑'],answer:'D',explanation:'D选项正确（硫在氧气中燃烧生成SO₂）。A中铁在氧气中燃烧生成Fe₃O₄不是Fe₂O₃；B中Mg为+2价产物应为MgO；C中"点燃"是条件不是反应物',score:2 },
      { id:'h121',subject:'chemistry',chapter:'化学方程式',section:'质量守恒定律',knowledgePoint:'质量守恒定律的应用',type:'choice',difficulty:'medium',question:'a克镁在b克氧气中燃烧，生成氧化镁的质量为（）',options:['A.一定等于(a+b)克','B.一定小于(a+b)克','C.一定大于(a+b)克','D.小于或等于(a+b)克'],answer:'D',explanation:'根据质量守恒定律，若二者恰好完全反应，生成物质量等于(a+b)g；若某物质过量，则生成物质量由不足量的物质决定，小于(a+b)g',score:2 },
      { id:'h122',subject:'chemistry',chapter:'化学方程式',section:'根据化学方程式的计算',knowledgePoint:'根据方程式简单计算',type:'choice',difficulty:'medium',question:'电解18克水，理论上可以得到氢气的质量为（）',options:['A.1克','B.2克','C.4克','D.8克'],answer:'B',explanation:'2H₂O通电2H₂↑+O₂↑，每36份质量的水生成4份质量的氢气，18克水生成氢气：18×(4/36)=2克',score:2 },
      { id:'h123',subject:'chemistry',chapter:'化学方程式',section:'化学方程式的意义',knowledgePoint:'化学计量数的意义',type:'choice',difficulty:'medium',question:'化学方程式2H₂+O₂=点燃=2H₂O中，参加反应的H₂与O₂的分子个数比为（）',options:['A.1:1','B.2:1','C.1:2','D.2:2'],answer:'B',explanation:'从配平的化学方程式中可读出，H₂与O₂的化学计量数之比（即分子个数比）为2:1',score:2 },
      { id:'h124',subject:'chemistry',chapter:'化学方程式',section:'化学方程式的意义',knowledgePoint:'化学方程式的读法',type:'choice',difficulty:'easy',question:'化学方程式C+O₂=点燃=CO₂不能读作（）',options:['A.碳和氧气在点燃条件下反应生成二氧化碳','B.一个碳原子和一个氧分子反应生成一个二氧化碳分子','C.每12份质量的碳与32份质量的氧气反应生成44份质量的二氧化碳','D.碳加氧气等于二氧化碳'],answer:'D',explanation:'化学方程式中的"+"读作"和、与"，"═"读作"生成"，不能读作"加"和"等于"',score:2 },
      { id:'h125',subject:'chemistry',chapter:'化学方程式',section:'化学方程式的书写',knowledgePoint:'化学方程式的配平',type:'choice',difficulty:'easy',question:'化学方程式Fe+CuSO₄═FeSO₄+Cu已配平，其中Fe与Cu的化学计量数之比为（）',options:['A.1:1','B.1:2','C.2:1','D.2:3'],answer:'A',explanation:'该方程式已自然配平，各物质化学计量数均为1，Fe与Cu的化学计量数之比为1:1',score:2 },
      { id:'h126',subject:'chemistry',chapter:'化学方程式',section:'质量守恒定律',knowledgePoint:'质量守恒定律的验证',type:'choice',difficulty:'hard',question:'下列实验中，能用来验证质量守恒定律的是（）',options:['A.蜡烛在空气中燃烧','B.过氧化氢溶液在敞口烧杯中分解','C.铁钉与硫酸铜溶液在密闭容器中反应','D.碳酸钠粉末与稀盐酸在敞口烧杯中反应'],answer:'C',explanation:'验证质量守恒定律的实验如果有气体参与或生成，必须在密闭容器中进行。铁与硫酸铜溶液反应无气体参与，在密闭容器中可以验证。其他选项均有气体（A消耗O₂生成CO₂，B产生O₂逸出，D产生CO₂逸出）',score:3 },
      { id:'h127',subject:'chemistry',chapter:'化学方程式',section:'根据化学方程式的计算',knowledgePoint:'根据方程式计算',type:'choice',difficulty:'hard',question:'将2.4克镁在空气中完全燃烧，至少需要氧气的质量约为（）',options:['A.0.8克','B.1.6克','C.3.2克','D.4.8克'],answer:'B',explanation:'2Mg+O₂点燃2MgO，Mg与O₂的质量比为48:32=3:2，设需要氧气质量为x，则2.4:x=3:2，x=1.6克',score:3 },
      { id:'h128',subject:'chemistry',chapter:'化学方程式',section:'化学方程式的书写',knowledgePoint:'化学方程式的书写规则',type:'choice',difficulty:'easy',question:'书写化学方程式时，不需要标注的是（）',options:['A.反应条件（如点燃、加热、通电等）','B.生成物的状态符号（↑或↓）','C.反应物和生成物的化学式','D.所有反应物的颜色'],answer:'D',explanation:'化学方程式中需要标注反应条件、"↑"（气体生成物）和"↓"（沉淀生成物），但不需要标注物质的颜色',score:2 },
      { id:'h129',subject:'chemistry',chapter:'化学方程式',section:'化学方程式的书写',knowledgePoint:'"↑"和"↓"的正确使用',type:'choice',difficulty:'medium',question:'关于化学方程式中"↑"和"↓"符号的使用，正确的是（）',options:['A.只要有气体生成就标"↑"','B.在溶液中反应生成的不溶性固体才标"↓"','C.反应物中有气体时，生成气体仍要标"↑"','D."↑"和"↓"可以随意标注或省略'],answer:'B',explanation:'溶液中反应生成的不溶性固体标"↓"；若反应物中有气体（参加反应的气体），生成的气体不标"↑"（如C+O₂=点燃=CO₂中CO₂不标↑）',score:2 },
      { id:'h130',subject:'chemistry',chapter:'化学方程式',section:'根据化学方程式的计算',knowledgePoint:'过量问题的判断',type:'choice',difficulty:'hard',question:'4克氢气与32克氧气充分反应后，生成水的质量为（）',options:['A.36克','B.32克','C.20克','D.40克'],answer:'A',explanation:'2H₂+O₂=点燃=2H₂O，质量比4:32:36，恰好完全反应，生成水36克；若有一种反应物过量，按不足量的计算',score:3 },

      // ========== 九、化学与生活 (10题: h131-h140) ==========
      { id:'h131',subject:'chemistry',chapter:'化学与生活',section:'人类重要的营养物质',knowledgePoint:'六大营养素',type:'choice',difficulty:'easy',question:'下列物质中，富含蛋白质的是（）',options:['A.米饭','B.鸡蛋','C.白菜','D.食用油'],answer:'B',explanation:'鸡蛋富含蛋白质；米饭富含糖类（淀粉），白菜富含维生素，食用油富含油脂',score:2 },
      { id:'h132',subject:'chemistry',chapter:'化学与生活',section:'化学元素与健康',knowledgePoint:'微量元素',type:'choice',difficulty:'easy',question:'下列元素中，属于人体必需微量元素的是（）',options:['A.钙','B.铁','C.钠','D.钾'],answer:'B',explanation:'铁（Fe）是人体必需的微量元素（在人体中含量低于0.01%），是血红蛋白的重要成分；钙、钠、钾属于常量元素（含量高于0.01%）',score:2 },
      { id:'h133',subject:'chemistry',chapter:'化学与生活',section:'有机合成材料',knowledgePoint:'合成材料',type:'choice',difficulty:'easy',question:'下列材料中，属于有机合成材料的是（）',options:['A.羊毛','B.棉花','C.塑料','D.蚕丝'],answer:'C',explanation:'塑料是有机合成材料（三大合成材料：塑料、合成纤维、合成橡胶）；羊毛、棉花（天然纤维）、蚕丝都是天然有机高分子材料',score:2 },
      { id:'h134',subject:'chemistry',chapter:'化学与生活',section:'有机合成材料',knowledgePoint:'白色污染',type:'choice',difficulty:'easy',question:'"白色污染"主要是指（）造成的污染',options:['A.白色废纸','B.石灰粉末','C.塑料废弃物','D.白色粉尘'],answer:'C',explanation:'"白色污染"是指塑料废弃物（如塑料袋、塑料餐盒、农用地膜等）对环境造成的污染，因其多为白色而得名',score:2 },
      { id:'h135',subject:'chemistry',chapter:'化学与生活',section:'化学与环境',knowledgePoint:'酸雨',type:'choice',difficulty:'easy',question:'下列气体中，排放到空气中会形成酸雨的是（）',options:['A.N₂','B.O₂','C.SO₂','D.CO₂'],answer:'C',explanation:'SO₂（二氧化硫）和氮氧化物（NO、NO₂等）是形成酸雨的主要气体，它们与空气中的水反应生成酸；CO₂溶于水生成碳酸，但正常雨水就含碳酸（pH≈5.6），不是形成酸雨的主因',score:2 },
      { id:'h136',subject:'chemistry',chapter:'化学与生活',section:'化学与环境',knowledgePoint:'水污染',type:'choice',difficulty:'medium',question:'下列做法中，会造成水污染的是（）',options:['A.生活污水集中处理后排放','B.工业废水达标后排放','C.将废旧电池随意丢弃','D.合理使用化肥和农药'],answer:'C',explanation:'废旧电池中含有重金属（如汞、镉、铅等），随意丢弃会污染土壤和地下水；A、B、D都是正确的环保做法',score:2 },
      { id:'h137',subject:'chemistry',chapter:'化学与生活',section:'化学与健康',knowledgePoint:'食品安全',type:'choice',difficulty:'medium',question:'下列做法中，不会危害人体健康的是（）',options:['A.用甲醛浸泡海产品保鲜','B.在面粉中添加过量增白剂','C.用适量小苏打发酵面粉','D.用工业酒精勾兑饮用酒'],answer:'C',explanation:'小苏打（NaHCO₃）是允许使用的食品添加剂，适量用于面粉发酵安全无害；甲醛有毒（可使蛋白质变性），工业酒精含甲醇（有毒，可致失明）',score:2 },
      { id:'h138',subject:'chemistry',chapter:'化学与生活',section:'常见的化学物质',knowledgePoint:'常见物质的主要成分',type:'choice',difficulty:'easy',question:'日常生活中食盐的主要成分是（）',options:['A.Na₂CO₃','B.NaHCO₃','C.NaCl','D.NaOH'],answer:'C',explanation:'食盐的主要成分是氯化钠（NaCl）；Na₂CO₃是纯碱，NaHCO₃是小苏打，NaOH是烧碱（有强腐蚀性，不能食用）',score:2 },
      { id:'h139',subject:'chemistry',chapter:'化学与生活',section:'有机合成材料',knowledgePoint:'天然材料与合成材料的区别',type:'choice',difficulty:'medium',question:'下列物品所使用的材料中，属于天然有机高分子材料的是（）',options:['A.塑料水杯','B.纯棉T恤','C.尼龙绳','D.不锈钢盆'],answer:'B',explanation:'纯棉的主要成分是纤维素，属于天然有机高分子材料（天然纤维）；塑料和尼龙是有机合成材料，不锈钢是金属材料',score:2 },
      { id:'h140',subject:'chemistry',chapter:'化学与生活',section:'化学与环境',knowledgePoint:'绿色化学',type:'choice',difficulty:'easy',question:'"绿色化学"的核心思想是（）',options:['A.使用绿色植物生产化学品','B.从源头上消除或减少污染','C.将废水处理达标后再排放','D.大量使用无污染的催化剂'],answer:'B',explanation:'绿色化学（环境友好化学）的核心是从源头上消除或减少污染，而不是污染产生后再治理（"预防优于治理"）',score:2 },

      // ========== 十、实验基础 (10题: h141-h150) ==========
      { id:'h141',subject:'chemistry',chapter:'实验基础',section:'常见仪器',knowledgePoint:'仪器的识别与使用',type:'choice',difficulty:'easy',question:'下列仪器中，可以直接加热的是（）',options:['A.量筒','B.试管','C.集气瓶','D.漏斗'],answer:'B',explanation:'试管可以直接用酒精灯加热；量筒只能用于量取液体不能加热（加热会变形导致刻度不准），集气瓶和漏斗不能加热',score:2 },
      { id:'h142',subject:'chemistry',chapter:'实验基础',section:'常见仪器',knowledgePoint:'量筒的使用',type:'choice',difficulty:'easy',question:'量取一定体积的液体时，应使用的仪器是（）',options:['A.试管','B.烧杯','C.量筒','D.集气瓶'],answer:'C',explanation:'量筒是专门用于量取一定体积液体的仪器，读数时视线应与量筒内液体凹液面的最低处保持水平',score:2 },
      { id:'h143',subject:'chemistry',chapter:'实验基础',section:'基本操作',knowledgePoint:'酒精灯的使用',type:'choice',difficulty:'easy',question:'使用酒精灯时，下列操作正确的是（）',options:['A.用嘴吹灭酒精灯','B.向燃着的酒精灯内添加酒精','C.熄灭时用灯帽盖灭','D.用一盏燃着的酒精灯去引燃另一盏'],answer:'C',explanation:'酒精灯必须用灯帽盖灭（隔绝空气）；吹灭可能引起灯内酒精蒸气燃烧；不能向燃着的酒精灯加酒精；不能用燃着的酒精灯对火（以防酒精洒出引发火灾）',score:2 },
      { id:'h144',subject:'chemistry',chapter:'实验基础',section:'基本操作',knowledgePoint:'药品的取用',type:'choice',difficulty:'easy',question:'取用固体粉末状药品时，应使用的仪器是（）',options:['A.镊子','B.药匙','C.胶头滴管','D.量筒'],answer:'B',explanation:'取用固体粉末用药匙（或纸槽）；镊子用于取用块状固体（如锌粒），胶头滴管用于滴加少量液体',score:2 },
      { id:'h145',subject:'chemistry',chapter:'实验基础',section:'基本操作',knowledgePoint:'加热操作',type:'choice',difficulty:'medium',question:'给试管中的液体加热时，液体体积一般不超过试管容积的（）',options:['A.1/4','B.1/3','C.1/2','D.2/3'],answer:'B',explanation:'给试管内液体加热时，液体体积不应超过试管容积的1/3，以防液体沸腾时冲出试管',score:2 },
      { id:'h146',subject:'chemistry',chapter:'实验基础',section:'基本操作',knowledgePoint:'闻气体的方法',type:'choice',difficulty:'easy',question:'闻气体气味时的正确方法是（）',options:['A.把鼻子凑到瓶口直接闻','B.用手在瓶口轻轻扇动，使极少量气体飘入鼻孔','C.用嘴对着瓶口吸气','D.戴上口罩后再闻'],answer:'B',explanation:'闻气体应采用"扇闻法"——用手在瓶口上方轻轻扇动，使极少量气体飘入鼻孔，不可直接凑近瓶口闻，以防吸入有毒或刺激性气体',score:2 },
      { id:'h147',subject:'chemistry',chapter:'实验基础',section:'常见仪器',knowledgePoint:'玻璃仪器的洗涤',type:'choice',difficulty:'medium',question:'玻璃仪器洗涤干净的标志是（）',options:['A.仪器内壁无水珠','B.仪器内壁附着的水既不聚成水滴也不成股流下','C.仪器变得透明','D.用pH试纸检验为中性'],answer:'B',explanation:'玻璃仪器洗净的标准：洗过的玻璃仪器内壁附着的水均匀，既不聚成水滴，也不成股流下，而是一层均匀的水膜',score:2 },
      { id:'h148',subject:'chemistry',chapter:'实验基础',section:'基本操作',knowledgePoint:'装置气密性检查',type:'choice',difficulty:'easy',question:'检查装置气密性时，先将导管一端放入水中，再用手紧握容器外壁，若导管口有气泡冒出，说明（）',options:['A.装置漏气','B.装置气密性良好（不漏气）','C.装置内充满氧气','D.装置需要更换'],answer:'B',explanation:'手捂加热使容器内空气膨胀，若装置不漏气，膨胀的空气就会从导管口排出形成气泡，证明气密性良好',score:2 },
      { id:'h149',subject:'chemistry',chapter:'实验基础',section:'常见仪器',knowledgePoint:'托盘天平的使用',type:'choice',difficulty:'medium',question:'用托盘天平称量药品时，正确的做法是（）',options:['A.药品直接放在托盘上','B.在两个托盘上各放一张质量相等的称量纸','C.所有药品都放在称量纸上','D.用手直接取放砝码'],answer:'B',explanation:'称量药品时应在托盘上各放一张质量相等的纸，防止药品腐蚀托盘；有腐蚀性或易潮解的药品（如NaOH）应放在玻璃器皿（如烧杯）中称量；取砝码应用镊子',score:2 },
      { id:'h150',subject:'chemistry',chapter:'实验基础',section:'实验安全',knowledgePoint:'意外事故处理',type:'choice',difficulty:'hard',question:'实验中不慎将少量浓硫酸溅到皮肤上，正确的处理方法是（）',options:['A.立即用大量水冲洗','B.先用干布擦拭，再用大量水冲洗，然后涂上3%~5%的NaHCO₃溶液','C.用NaOH溶液涂抹中和','D.等待自然风干后再处理'],answer:'B',explanation:'浓硫酸溅到皮肤上，应先用干布擦去（浓硫酸溶于水放大量热，直接用水冲洗会加重灼伤），再用大量水冲洗，最后涂上3%~5%的NaHCO₃溶液中和残留的酸',score:3 }
    ],
  },
};

/**
 * 获取题库
 * @returns {Object} 完整题库
 */
export function getQuestionBank() {
  return QUESTION_BANK;
}

/**
 * 获取指定科目的题目
 * @param {string} subject - 科目ID
 * @param {string} chapter - 章节（可选）
 * @returns {Array} 题目列表
 */
export function getQuestionsBySubject(subject, chapter = null) {
  const subjectQuestions = QUESTION_BANK[subject];
  if (!subjectQuestions) return [];

  if (chapter) {
    return subjectQuestions[chapter] || [];
  }

  // 返回该科目所有题目
  return Object.values(subjectQuestions).flat();
}

/** 难度级别排序映射 */
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

/**
 * 随机选择题目（自适应版本）
 *
 * 当提供 history 参数时，根据已答题正确率动态选择题目难度：
 * - 连续答对3题 → 提升难度
 * - 连续答错2题 → 降低难度
 * - 同一知识点的题错超过2次 → 多出该知识点的变式题
 *
 * @param {Array} questions - 题目池
 * @param {number} count - 选择数量
 * @param {string|null} difficulty - 难度（可选，传 null 时根据 history 自适应）
 * @param {Array} history - 答题历史记录（可选），每项含 { questionId, isCorrect, knowledgePoint, difficulty }
 * @returns {Array} 选中的题目
 */
export function selectRandomQuestions(questions, count, difficulty = null, history = null) {
  let filtered = questions;

  if (history && history.length > 0) {
    // ---- 自适应模式 ----
    const answeredIds = new Set(history.map(h => h.questionId));
    const adaptiveDiff = calculateAdaptiveDifficulty(history);
    const targetDifficulty = difficulty || adaptiveDiff;

    // 识别薄弱知识点（同一知识点错超过2次）
    const kpWrongCount = {};
    history.forEach(entry => {
      if (!entry.isCorrect && entry.knowledgePoint) {
        kpWrongCount[entry.knowledgePoint] = (kpWrongCount[entry.knowledgePoint] || 0) + 1;
      }
    });
    const weakKPs = Object.entries(kpWrongCount)
      .filter(([, c]) => c > 2)
      .map(([kp]) => kp);

    // 排除已答题目
    let candidates = filtered.filter(q => !answeredIds.has(q.id));
    if (candidates.length === 0) candidates = filtered;

    const selected = [];

    for (let i = 0; i < count; i++) {
      // 每轮重新过滤已选题目
      const selectedIds = new Set(selected.map(q => q.id));
      let pool = candidates.filter(q => !selectedIds.has(q.id));
      if (pool.length === 0) pool = candidates;

      // 优先：薄弱知识点 + 目标难度
      if (weakKPs.length > 0) {
        const weakPool = pool.filter(q => weakKPs.includes(q.knowledgePoint) && q.difficulty === targetDifficulty);
        if (weakPool.length > 0) {
          const pick = weakPool[Math.floor(Math.random() * weakPool.length)];
          selected.push(pick);
          continue;
        }
      }

      // 次优：目标难度
      const diffPool = pool.filter(q => q.difficulty === targetDifficulty);
      if (diffPool.length > 0) {
        const pick = diffPool[Math.floor(Math.random() * diffPool.length)];
        selected.push(pick);
        continue;
      }

      // 兜底：随机选
      const pick = pool[Math.floor(Math.random() * pool.length)];
      selected.push(pick);
    }

    return selected;
  }

  // ---- 非自适应模式（兼容旧调用） ----
  if (difficulty) {
    filtered = questions.filter(q => q.difficulty === difficulty);
  }

  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 根据答题历史计算自适应难度
 *
 * 规则：
 * - 无历史记录时默认返回 'medium'
 * - 连续答对 3 题及以上 → 提升一级难度
 * - 连续答错 2 题及以上 → 降低一级难度
 * - 否则保持最近一题的难度
 *
 * @param {Array} history - 答题历史，每项含 { isCorrect, difficulty }
 * @returns {string} 建议的下一题难度：'easy' | 'medium' | 'hard'
 */
export function calculateAdaptiveDifficulty(history) {
  if (!history || history.length === 0) return 'medium';

  // 统计末尾连续正确/错误
  let consecutiveCorrect = 0;
  let consecutiveWrong = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].isCorrect) consecutiveCorrect++;
    else break;
  }

  for (let i = history.length - 1; i >= 0; i--) {
    if (!history[i].isCorrect) consecutiveWrong++;
    else break;
  }

  const lastDifficulty = history[history.length - 1].difficulty || 'medium';
  const currentIdx = DIFFICULTY_ORDER.indexOf(lastDifficulty);

  // 连续答对3题 → 提升难度
  if (consecutiveCorrect >= 3 && currentIdx < DIFFICULTY_ORDER.length - 1) {
    return DIFFICULTY_ORDER[currentIdx + 1];
  }

  // 连续答错2题 → 降低难度
  if (consecutiveWrong >= 2 && currentIdx > 0) {
    return DIFFICULTY_ORDER[currentIdx - 1];
  }

  return lastDifficulty;
}

/**
 * 智能选择下一道题
 *
 * 根据科目和答题历史，综合自适应难度和薄弱知识点，选出最合适的下一题。
 *
 * 策略优先级：
 * 1. 薄弱知识点（错超过2次）+ 自适应难度匹配 → 变式题巩固
 * 2. 自适应难度匹配的题目
 * 3. 任意未答题 → 兜底
 *
 * @param {string} subject - 科目ID（如 'math', 'physics'）
 * @param {Array} history - 答题历史，每项含 { questionId, isCorrect, knowledgePoint, difficulty }
 * @returns {Object|null} 下一道题目，无可用题时返回 null
 */
export function getNextQuestion(subject, history = []) {
  const allQuestions = getQuestionsBySubject(subject);
  if (!allQuestions || allQuestions.length === 0) return null;

  const targetDifficulty = calculateAdaptiveDifficulty(history);

  // 统计薄弱知识点
  const kpWrongCount = {};
  history.forEach(entry => {
    if (!entry.isCorrect && entry.knowledgePoint) {
      kpWrongCount[entry.knowledgePoint] = (kpWrongCount[entry.knowledgePoint] || 0) + 1;
    }
  });
  const weakKPs = Object.entries(kpWrongCount)
    .filter(([, c]) => c > 2)
    .map(([kp]) => kp);

  // 排除已答题目
  const answeredIds = new Set(history.map(h => h.questionId));
  let candidates = allQuestions.filter(q => !answeredIds.has(q.id));

  // 全部答过则重置题库
  if (candidates.length === 0) {
    candidates = allQuestions;
  }

  // 优先级 1：薄弱知识点 + 自适应难度
  if (weakKPs.length > 0) {
    const weakCandidates = candidates.filter(
      q => weakKPs.includes(q.knowledgePoint) && q.difficulty === targetDifficulty
    );
    if (weakCandidates.length > 0) {
      return weakCandidates[Math.floor(Math.random() * weakCandidates.length)];
    }
  }

  // 优先级 2：自适应难度
  const diffCandidates = candidates.filter(q => q.difficulty === targetDifficulty);
  if (diffCandidates.length > 0) {
    return diffCandidates[Math.floor(Math.random() * diffCandidates.length)];
  }

  // 优先级 3：任意题
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * 生成诊断测试
 * @param {Object} config - 测试配置（可选）
 * @returns {Object} 测试信息
 */
export function generateDiagnosisTest(config = DIAGNOSIS_CONFIG) {
  const test = {
    id: `diagnosis_${Date.now()}`,
    createdAt: new Date().toISOString(),
    totalDuration: config.totalDuration,
    totalScore: config.totalScore,
    subjects: {},
  };

  // 为每个科目生成题目（使用自适应难度分布策略）
  Object.entries(config.questionCount).forEach(([subject, count]) => {
    const allQuestions = getQuestionsBySubject(subject);
    if (allQuestions.length === 0) return;

    // 自适应难度分布：40% 基础 + 40% 中等 + 20% 提高
    // 确保诊断测试能全面评估学生水平
    const easyCount = Math.round(count * 0.4);
    const mediumCount = Math.round(count * 0.4);
    const hardCount = count - easyCount - mediumCount;

    const easyPool = allQuestions.filter(q => q.difficulty === 'easy');
    const mediumPool = allQuestions.filter(q => q.difficulty === 'medium');
    const hardPool = allQuestions.filter(q => q.difficulty === 'hard');

    // 根据池子实际大小调整（兜底策略）
    const actualEasy = Math.min(easyCount, easyPool.length);
    const actualMedium = Math.min(mediumCount, mediumPool.length);
    const actualHard = Math.min(hardCount, hardPool.length);
    const remaining = count - actualEasy - actualMedium - actualHard;
    const fillPool = allQuestions.filter(
      q => ![...easyPool.slice(0, actualEasy), ...mediumPool.slice(0, actualMedium), ...hardPool.slice(0, actualHard)]
        .map(x => x.id).includes(q.id)
    );

    const selected = [
      ...selectRandomQuestions(easyPool, actualEasy),
      ...selectRandomQuestions(mediumPool, actualMedium),
      ...selectRandomQuestions(hardPool, actualHard),
      ...(remaining > 0 ? selectRandomQuestions(fillPool, remaining) : []),
    ];

    // 打乱题目顺序（避免同一难度连续出现）
    const shuffledSelect = [...selected].sort(() => Math.random() - 0.5);

    test.subjects[subject] = {
      questions: shuffledSelect,
      duration: config.subjectDuration[subject],
      totalScore: shuffledSelect.reduce((sum, q) => sum + q.score, 0),
    };
  });

  // 添加 flat questions 数组供 DiagnosisScreen 等组件直接使用
  test.questions = Object.values(test.subjects).flatMap(s => s.questions);

  return test;
}

/**
 * 计算单题得分
 * @param {Object} question - 题目
 * @param {string} answer - 学生答案
 * @returns {Object} 得分信息
 */
export function calculateQuestionScore(question, answer) {
  // Detect uncertain answer sentinel — student marked "I don't know"
  if (answer === '__UNCERTAIN__') {
    return {
      questionId: question.id,
      studentAnswer: '不确定',
      correctAnswer: question.answer,
      isCorrect: false,
      isUncertain: true,
      score: 0,
      maxScore: question.score,
    };
  }

  // Normalize answer: convert numeric index to option letter (e.g., 0->'A', 2->'C')
  // This handles the case where DiagnosisScreen stores user selection as a numeric
  // index into the options array, while the question bank stores answer as a letter.
  let normalizedAnswer = answer;
  const isNumeric = typeof answer === 'number' || (typeof answer === 'string' && answer.trim() !== '' && !isNaN(Number(answer)));
  if (isNumeric) {
    const idx = Number(answer);
    if (question.options && idx >= 0 && idx < question.options.length) {
      normalizedAnswer = String.fromCharCode(65 + idx);
    }
  }

  const isCorrect = question.answer === normalizedAnswer;

  return {
    questionId: question.id,
    studentAnswer: normalizedAnswer,
    correctAnswer: question.answer,
    isCorrect,
    isUncertain: false,
    score: isCorrect ? question.score : 0,
    maxScore: question.score,
  };
}

/**
 * 计算科目得分
 * @param {Array} answers - 答案列表
 * @param {Array} questions - 题目列表
 * @returns {Object} 科目得分
 */
export function calculateSubjectScore(answers, questions) {
  let totalScore = 0;
  let maxScore = 0;
  const details = [];

  // Support both array-of-objects [{ questionId, answer }] and flat map { questionId: answerValue }
  const answerMap = Array.isArray(answers)
    ? answers.reduce((map, a) => ({ ...map, [a.questionId]: a.answer }), {})
    : answers || {};

  questions.forEach(question => {
    let rawAnswer = answerMap[question.id];
    if (rawAnswer !== undefined && rawAnswer !== null) {
      // Convert numeric index to the corresponding option letter (e.g. 1 -> 'B' from 'B.xxx')
      let answer = rawAnswer;
      if (typeof rawAnswer === 'number') {
        if (question.options && question.options[rawAnswer]) {
          answer = question.options[rawAnswer][0]
        } else {
          answer = String(rawAnswer)
        }
      }
      const result = calculateQuestionScore(question, answer);
      totalScore += result.score;
      details.push(result);
    }
    maxScore += question.score;
  });

  return {
    totalScore,
    maxScore,
    percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
    details,
  };
}

/**
 * 计算总分
 * @param {Object} test - 测试信息
 * @param {Object} answers - 所有答案
 * @returns {Object} 总分信息
 */
export function calculateTotalScore(test, answers) {
  const subjectScores = {};
  let totalScore = 0;
  let maxScore = 0;

  Object.entries(test.subjects).forEach(([subject, subjectData]) => {
    // Pass the flat answers map directly - calculateSubjectScore handles both formats
    const scoreInfo = calculateSubjectScore(answers[subject] || answers, subjectData.questions);

    subjectScores[subject] = scoreInfo;
    totalScore += scoreInfo.totalScore;
    maxScore += scoreInfo.maxScore;
  });

  return {
    totalScore,
    maxScore,
    percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
    subjectScores,
  };
}

/**
 * 获取掌握度等级
 * @param {number} percentage - 得分百分比
 * @returns {Object} 等级信息
 */
export function getMasteryLevel(percentage) {
  const { grading } = DIAGNOSIS_CONFIG;

  if (percentage >= grading.excellent.percentage[0]) {
    return { ...grading.excellent, key: 'excellent' };
  } else if (percentage >= grading.good.percentage[0]) {
    return { ...grading.good, key: 'good' };
  } else if (percentage >= grading.average.percentage[0]) {
    return { ...grading.average, key: 'average' };
  } else {
    return { ...grading.poor, key: 'poor' };
  }
}

/**
 * 识别薄弱知识点
 * @param {Object} scoreInfo - 得分信息
 * @returns {Array} 薄弱知识点列表
 */
export function identifyWeakPoints(scoreInfo) {
  const weakPointsMap = {};

  Object.entries(scoreInfo.subjectScores).forEach(([subject, subjectScore]) => {
    // Process all details (both correct and wrong) to count totalQuestions per knowledge point
    subjectScore.details.forEach(detail => {
      const question = getQuestionById(detail.questionId);
      if (question) {
        const key = `${subject}_${question.knowledgePoint}`;
        if (!weakPointsMap[key]) {
          weakPointsMap[key] = {
            subject,
            knowledgePoint: question.knowledgePoint,
            chapter: question.chapter,
            section: question.section,
            priority: subjectScore.percentage < 50 ? 'high' : 'medium',
            totalQuestions: 0,
            wrongCount: 0,
            uncertainCount: 0,
          };
        }
        weakPointsMap[key].totalQuestions++;
        if (!detail.isCorrect) {
          weakPointsMap[key].wrongCount++;
          if (detail.isUncertain) {
            weakPointsMap[key].uncertainCount++;
          }
        }
      }
    });
  });

  // Only return knowledge points that have at least one wrong answer
  return Object.values(weakPointsMap).filter(wp => wp.wrongCount > 0);
}

/**
 * 根据ID查找题目
 * @param {string} questionId - 题目ID
 * @returns {Object|null} 题目信息
 */
function getQuestionById(questionId) {
  for (const subject of Object.values(QUESTION_BANK)) {
    for (const chapter of Object.values(subject)) {
      const question = chapter.find(q => q.id === questionId);
      if (question) return question;
    }
  }
  return null;
}

/**
 * 生成学习建议
 * @param {Object} diagnosisResult - 诊断结果
 * @returns {Array} 建议列表
 */
export function generateRecommendations(diagnosisResult) {
  const recommendations = [];

  // 根据各科表现生成建议
  Object.entries(diagnosisResult.subjectScores).forEach(([subject, score]) => {
    const level = getMasteryLevel(score.percentage);

    if (level.key === 'excellent') {
      recommendations.push({
        type: 'strength',
        subject,
        message: `${getSubjectName(subject)}基础扎实，可以加速学习`,
        priority: 'low',
      });
    } else if (level.key === 'poor') {
      recommendations.push({
        type: 'weakness',
        subject,
        message: `${getSubjectName(subject)}需要重点补习`,
        priority: 'high',
      });
    }
  });

  // 按优先级排序
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * 获取科目名称
 * @param {string} subjectId - 科目ID
 * @returns {string} 科目名称
 */
function getSubjectName(subjectId) {
  return getSubjectDisplayName(subjectId);
}

/**
 * 生成诊断报告
 * @param {Object} test - 测试信息
 * @param {Object} answers - 答案
 * @returns {Object} 诊断报告
 */
export function generateDiagnosisReport(test, answers) {
  const scoreInfo = calculateTotalScore(test, answers);
  const weakPoints = identifyWeakPoints(scoreInfo);
  const recommendations = generateRecommendations(scoreInfo);
  const overallLevel = getMasteryLevel(scoreInfo.percentage);

  return {
    date: new Date().toISOString(),
    testId: test.id,
    totalScore: scoreInfo.totalScore,
    totalPercentage: scoreInfo.percentage,
    totalMaxScore: scoreInfo.maxScore,
    overallLevel,
    subjectScores: Object.entries(scoreInfo.subjectScores).map(([subject, score]) => ({
      subject,
      subjectName: getSubjectName(subject),
      score: score.totalScore,
      maxScore: score.maxScore,
      percentage: score.percentage,
      details: score.details,
      level: getMasteryLevel(score.percentage),
    })),
    weakPoints,
    recommendations,
    studyPlan: generateStudyPlan(scoreInfo, weakPoints),
  };
}

/**
 * 生成学习计划建议
 * @param {Object} scoreInfo - 得分信息
 * @param {Array} weakPoints - 薄弱知识点
 * @returns {Object} 学习计划
 */
function generateStudyPlan(scoreInfo, weakPoints) {
  const highPriority = weakPoints.filter(wp => wp.priority === 'high');
  const mediumPriority = weakPoints.filter(wp => wp.priority === 'medium');

  return {
    phase1: {
      duration: '2周',
      focus: '基础巩固',
      tasks: highPriority.map(wp => ({
        subject: wp.subject,
        topic: wp.knowledgePoint,
        action: '重点复习',
      })),
    },
    phase2: {
      duration: '4周',
      focus: '预习八年级下册',
      tasks: mediumPriority.map(wp => ({
        subject: wp.subject,
        topic: wp.chapter,
        action: '预习新内容',
      })),
    },
    phase3: {
      duration: '2周',
      focus: '提前预习化学',
      tasks: [
        {
          subject: 'chemistry',
          topic: '九年级上册',
          action: '提前预习',
        },
      ],
    },
  };
}

export default {
  getQuestionBank,
  getQuestionsBySubject,
  selectRandomQuestions,
  calculateAdaptiveDifficulty,
  getNextQuestion,
  generateDiagnosisTest,
  calculateQuestionScore,
  calculateSubjectScore,
  calculateTotalScore,
  getMasteryLevel,
  identifyWeakPoints,
  generateRecommendations,
  generateDiagnosisReport,
};

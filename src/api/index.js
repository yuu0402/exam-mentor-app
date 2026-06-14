/**
 * 夸克网盘API模块 - 统一导出
 *
 * 集中导出所有夸克网盘相关的API模块，方便外部使用。
 *
 * @module api
 * @example
 * // 导入全部
 * import * as QuarkAPI from '../api';
 * QuarkAPI.getUserInfo();
 *
 * // 按需导入
 * import { getUserInfo, getFileList } from '../api';
 * import { saveCookie, getCookie } from '../api';
 * import { parseFullCourseDirectory } from '../api';
 */

// ========== 后端 API ==========
export {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  isLoggedIn,
  getCachedUser,
  startDiagnosis,
  getDiagnosisQuestions,
  submitDiagnosis,
  getDiagnosisResult,
  getLatestDiagnosis,
  startDiagnosisV2,
  getTodayTasks,
  startTask,
  completeTask,
  getTaskStats,
  getTodayDynamicPlan,
  startPomodoro,
  completePomodoro,
  getWrongQuestions,
  getTodayReviewQueue,
  reviewWrongQuestion,
  checkIn,
  getGameState,
  recordLearningLog,
  getLearningStats,
  healthCheck,
} from './backend';

// ========== 夸克网盘API ==========
export {
  getUserInfo,
  getFileList,
  searchFiles,
  getFileInfo,
  getVideoPlayUrl,
  getShareToken,
  getAllShareFiles,
  getShareFileList,
  checkConnection,
} from './quark-api';

// ========== Cookie管理 ==========
export {
  saveCookie,
  getCookie,
  clearCookie,
  isCookieValid,
  getCookieRemainingDays,
  getCookieStatus,
} from './cookie-manager';

// ========== 课程目录解析 ==========
export {
  parseFullCourseDirectory,
  organizeBySubject,
  searchCourse,
  getStatistics,
  getShareConfig,
} from './course-parser';

// ========== 分享链接解析 ==========
export {
  extractShareCode,
  parseShareLink,
  getShareVideoUrl,
  validateShareLink,
} from './share-link-parser';

// ========== 默认导出（包含所有模块） ==========
import * as backend from './backend';
import * as quarkApi from './quark-api';
import * as cookieManager from './cookie-manager';
import * as courseParser from './course-parser';
import * as shareLinkParser from './share-link-parser';

export default {
  // 后端 API
  ...backend,

  // 夸克网盘API
  ...quarkApi,

  // Cookie管理
  ...cookieManager,

  // 课程目录解析
  ...courseParser,

  // 分享链接解析
  ...shareLinkParser,

  // 子模块命名空间（便于按模块访问）
  backend,
  quarkApi,
  cookieManager,
  courseParser,
  shareLinkParser,
};

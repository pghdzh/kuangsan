import http from "../axios";

/**
 * @function 获取 B 站用户粉丝数
 * @param {number} uid – B 站用户 UID，必填
 * @returns {Promise<any>}
 */
export const getBiliFansCount = (): Promise<any> => {
  // 由于默认 baseURL 指向自己后端，这里传入空 baseURL 强制请求 bili 接口
  return http.get("/api/bili/fans", { uid: 372611876 })
};


export const getBiliChargeList = (): Promise<any> => {
  // 由于默认 baseURL 指向自己后端，这里传入空 baseURL 强制请求 bili 接口
  return http.get("/api/bili/recharge")
};


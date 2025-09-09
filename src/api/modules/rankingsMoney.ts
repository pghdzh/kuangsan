// src/services/rankingsMoneyService.ts
import http from "../axios";

/**
 * 获取排行榜（分页）
 * @param params - 例如：{ page: 1, pageSize: 10, q?: string }
 */
export const getRankingMoneyList = (params: any): Promise<any> => {
  return http.get("/api/rankingsMoney", params);
};

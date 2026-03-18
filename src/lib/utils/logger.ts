/**
 * 애플리케이션 공통 로거 유틸리티입니다.
 * Rule 09에 따라 로그를 최소 request/action/error 수준으로 남깁니다.
 */
export class Logger {
    moduleName: string;
  
    /**
     * @param moduleName - 로그를 남기는 모듈 또는 컴포넌트의 이름
     */
    constructor(moduleName: string) {
      this.moduleName = moduleName;
    }
  
    /**
     * 정보를 기록합니다.
     * @param message 
     * @param data 
     */
    info(message: string, data?: any) {
      this._log('INFO', message, data);
    }
  
    /**
     * 사용자 액션을 기록합니다.
     * @param actionName 
     * @param payload 
     */
    action(actionName: string, payload?: any) {
      this._log('ACTION', actionName, payload);
    }
  
    /**
     * 에러를 기록합니다. (개발자용과 사용자용 에러 처리를 분리할 수 있는 진입점)
     * @param message 
     * @param error 
     */
    error(message: string, error?: any) {
      console.error(`[${this._getTime()}] [ERROR] [${this.moduleName}] ${message}`, error || '');
    }
  
    /**
     * 내부 공통 로그 출력 포맷
     * @private
     */
    private _log(level: string, message: string, data?: any) {
      const formattedData = data ? data : '';
      console.log(`[${this._getTime()}] [${level}] [${this.moduleName}] ${message}`, formattedData);
    }
  
    /**
     * 현재 시각을 반환합니다.
     * @private
     * @returns string
     */
    private _getTime(): string {
      return new Date().toISOString();
    }
  }
  

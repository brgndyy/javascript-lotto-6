import { REWARD_MESSAGES } from '../constants/rewardMessage.js';

class Reward {
  /**
   * @member { string } BONUS_MATCH_KEY 보너스 볼 일치를 담당할 키
   * @member { string } BONUS_MATCH_COUNT 보너스 볼 일치 조건 갯수
   * @member { object } PRIZE_MONEY 등수에 맞는 금액을 담은 객체
   * @member { string[] } ORDER_KEYS 최종적으로 반복문을 돌며 결과를 추출하게 할 배열
   */

  static BONUS_MATCH_KEY = '5+1';

  static BONUS_MATCH_COUNT = 5;

  static PRIZE_MONEY = {
    3: 5000,
    4: 50000,
    5: 1500000,
    6: 2000000000,
    '5+1': 30000000,
  };

  static ORDER_KEYS = ['3', '4', '5', '5+1', '6'];

  /**
   * @type { [number, number, number, number, number, number] }
   */

  #winningNumbers;

  /**
   * @type { number }
   */
  #bonusNumber;

  /**
   *
   * @param { WinningLotto } winningLotto
   */

  constructor(winningLotto) {
    this.#winningNumbers = winningLotto.getWinningNumbers();
    this.#bonusNumber = winningLotto.getBonusNumber();
  }

  /**
   * PRIZE_MONEY 객체에서 상금을 반환하는 함수
   * @param { number } matchCount
   * @returns { number }
   */

  calculatePrizeForMatch(matchCount) {
    return Object.prototype.hasOwnProperty.call(Reward.PRIZE_MONEY, matchCount)
      ? Reward.PRIZE_MONEY[matchCount]
      : 0;
  }

  /**
   * 통계 상태를 업데이트 해주는 함수
   * @param { object } statistics
   * @param { string } key
   * @returns { object }
   */

  updateMatchCount(statistics, key) {
    const updatedStatistics = {
      ...statistics,
      [key]: (statistics[key] || 0) + 1,
    };

    return updatedStatistics;
  }

  /**
   * 통계와 상금을 업데이트해서 리턴해주는 함수
   * @param { object } statistics
   * @param { number } matchCount
   * @param { number[] } lotto
   * @param { number } bonusNumber
   * @returns { object }
   */

  updateStatisticsAndPrize(statistics, matchCount, lotto, bonusNumber) {
    const key =
      matchCount === Reward.BONUS_MATCH_COUNT && lotto.includes(bonusNumber)
        ? Reward.BONUS_MATCH_KEY
        : matchCount.toString();
    const updatedStatistics = this.updateMatchCount(statistics, key);
    return {
      prize: this.calculatePrizeForMatch(key),
      statistics: updatedStatistics,
    };
  }

  /**
   * 통계와 상금을 업데이트 해주는 함수(2), 함수 길이 제한을 위해 updateStatisticsAndPrize와 나누었습니다.
   * @param { object } statistics
   * @param { number } matchCount
   * @param { number[] } lotto
   * @returns { object }
   */

  updateStatistics(statistics, matchCount, lotto) {
    const { prize, statistics: updatedStatistics } = this.updateStatisticsAndPrize(
      statistics,
      matchCount,
      lotto,
      this.#bonusNumber,
    );
    return {
      prize,
      statistics: updatedStatistics,
    };
  }

  /**
   * 통계 key에 맞춰서 통계 결과 문자열을 반환해주는 함수
   * @param { string } key
   * @param { object } statistics
   * @returns
   */

  getStatisticsRow(key, statistics) {
    const displayKey =
      key === '5+1' ? REWARD_MESSAGES.match_five_not_bonus : REWARD_MESSAGES.match_result(key);
    const formattedPrize = `${Reward.PRIZE_MONEY[key].toLocaleString('ko-KR')}원`;
    return REWARD_MESSAGES.statistics_message_format(displayKey, formattedPrize, statistics[key]);
  }

  /**
   * matchCount의 갯수를 리턴해주는 함수
   * @param { [number, number, number, number, number, number] } lotto
   * @returns { number }
   */

  calculateMatchCount(lotto) {
    let count = 0;
    lotto.forEach((num) => {
      if (this.#winningNumbers.includes(num)) count++;
    });
    return count;
  }

  /**
   * 결과적인 상금과 통계 결과를 얻어오는 함수
   * @param { number[] } lottos
   * @param { object } initialStatistics
   * @returns { object }
   */

  calculateTotalPrizeAndStatistics(lottos, initialStatistics) {
    let totalPrize = 0;
    let updatedStatistics = { ...initialStatistics };

    lottos.forEach((lotto) => {
      const lottoNums = lotto.getNumbers();
      const matchCount = this.calculateMatchCount(lottoNums);
      const update = this.updateStatistics(updatedStatistics, matchCount, lottoNums);
      totalPrize += update.prize;
      updatedStatistics = update.statistics;
    });

    return { totalPrize, statistics: updatedStatistics };
  }

  /**
   * 통계 결과와 수익률을 반환해주는 함수
   * @param { number[] } lottos
   * @returns { string[] }
   */

  calculateReward(lottos) {
    const statistics = this.initializeStatistics();

    const { totalPrize, statistics: updatedStatistics } = this.calculateTotalPrizeAndStatistics(
      lottos,
      statistics,
    );

    const totalSpent = lottos.length * 1000;
    const rateOfReturn = ((totalPrize / totalSpent) * 100).toFixed(1);

    return this.formatOutput(updatedStatistics, rateOfReturn);
  }

  /**
   * 초기 통계 객체
   * @returns { object }
   */

  initializeStatistics() {
    return { 3: 0, 4: 0, 5: 0, 6: 0, '5+1': 0 };
  }

  /**
   * ORDER_KEYS를 돌면서 통계 결과 문자열을 배열로 반환하는 함수
   * @param { object } updatedStatistics
   * @param { number } rateOfReturn
   * @returns { string[] }
   */

  formatOutput(updatedStatistics, rateOfReturn) {
    const output = Reward.ORDER_KEYS.map((key) => this.getStatisticsRow(key, updatedStatistics));
    output.push(REWARD_MESSAGES.rate_result(rateOfReturn));
    return output;
  }
}

export default Reward;
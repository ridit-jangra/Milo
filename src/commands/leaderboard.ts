import type { Command } from "../types";
import {
  fetchLeaderboard,
  getMyRank,
  renderLeaderboard,
} from "../utils/leaderboard";
import { getUserId } from "../auth";

const command = {
  type: "local",
  name: "leaderboard",
  description: "Show the Milo leaderboard 🏆",
  isEnabled: true,
  isHidden: false,
  userFacingName() {
    return "leaderboard";
  },
  async call() {
    const [entries, myRank, myUserId] = await Promise.all([
      fetchLeaderboard(10),
      getMyRank(),
      getUserId(),
    ]);

    if (entries.length === 0) {
      return "No one on the leaderboard yet. Be the first! 👑";
    }

    return renderLeaderboard(entries, myUserId, myRank);
  },
} satisfies Command;

export default command;

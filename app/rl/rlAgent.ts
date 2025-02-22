// lib/rlAgent.ts
type State = string; // e.g., restaurant ID or features
type Action = {
  restaurantId: string;
  type: string; // e.g., "burger", "pizza", "boba"
};

class RLAgent {
  private qTable: Record<State, Record<string, number>>;
  private alpha: number; // Learning rate
  private gamma: number; // Discount factor
  private lastRecommendedType: string | null; // Track the last recommended type

  constructor(alpha: number = 0.1, gamma: number = 0.9) {
    this.qTable = {};
    this.alpha = alpha;
    this.gamma = gamma;
    this.lastRecommendedType = null;
  }

  private initializeState(state: State) {
    if (!this.qTable[state]) {
      this.qTable[state] = {};
    }
  }

  public updateQValue(state: State, action: Action, reward: number, nextState: State) {
    this.initializeState(state);
    this.initializeState(nextState);

    const maxNextQ = Math.max(...Object.values(this.qTable[nextState] || { [action.restaurantId]: 0 }));
    const currentQ = this.qTable[state][action.restaurantId] || 0;

    this.qTable[state][action.restaurantId] = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
  }

  public getBestAction(state: State): Action | null {
    this.initializeState(state);
    const actions = this.qTable[state] || {};

    // Filter actions to prevent flooding with the same type
    const filteredActions = Object.keys(actions).map((restaurantId) => ({
      restaurantId,
      type: this.getRestaurantType(restaurantId), // Function to get restaurant type
    })).filter(action => action.type !== this.lastRecommendedType);
    
    // If no other types are available, allow the last type to be recommended
    if (filteredActions.length === 0) {
      return this.getHighestQAction(state);
    }

    // Randomly select one of the filtered actions
    const randomIndex = Math.floor(Math.random() * filteredActions.length);
    this.lastRecommendedType = filteredActions[randomIndex].type;
    return filteredActions[randomIndex];
  }

  private getHighestQAction(state: State): Action | null {
    const actions = this.qTable[state] || {};
    return Object.keys(actions).reduce((bestAction, restaurantId) => {
      if (actions[bestAction] === undefined || actions[restaurantId] > actions[bestAction]) {
        return { restaurantId, type: this.getRestaurantType(restaurantId) };
      }
      return bestAction;
    }, null);
  }

  private getRestaurantType(restaurantId: string): string {
    // Logic to determine the restaurant type based on restaurantId
    return restaurantId.includes("burger") ? "burger" : 
           restaurantId.includes("pizza") ? "pizza" : 
           "boba"; // Modify based on actual restaurant IDs
  }
}

export default RLAgent;
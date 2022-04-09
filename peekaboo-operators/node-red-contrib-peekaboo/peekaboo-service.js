// Interface for peekaboo services
class PeekabooService {
  // Called on initialization of node
  onInit(node) {}

  // Called when a payload is received by the node
  onInput(node, peekaboo) {
    // Do processing here
  }
}

// Async version of peekaboo service
class AsyncPeekabooService {
  // Called on initialization of node
  onInit(node) {}

  // Called when a payload is received by the node
  // Resolves promise after all processing is finished
  async onInput(node, peekaboo) {
    return new Promise((resolve) => {
      resolve(peekaboo);
    });
  }
}

module.exports = {
  PeekabooService,
  AsyncPeekabooService
};

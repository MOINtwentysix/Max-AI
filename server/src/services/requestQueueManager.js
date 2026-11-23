/**
 * RequestQueueManager
 * Ensures single-threaded / orderly Ollama inference execution.
 * When multiple requests come in concurrently, they enter a FIFO queue.
 * Live position updates (e.g. "Platz 2 von 3 in der Warteschlange") are broadcasted
 * to clients via SSE so users see their live queue bar and progress.
 */
export class RequestQueueManager {
  static queue = [];
  static activeRequest = null;

  /**
   * Enqueue a new request
   * @param {string} id - unique request ID
   * @param {Function} task - async function to execute when slot is free
   * @param {Function} onPositionUpdate - callback(position, total)
   */
  static enqueue(id, task, onPositionUpdate) {
    return new Promise((resolve, reject) => {
      const item = {
        id,
        task,
        onPositionUpdate,
        resolve,
        reject,
        joinedAt: Date.now(),
      };

      this.queue.push(item);
      this.broadcastPositions();
      this.processNext();
    });
  }

  static broadcastPositions() {
    this.queue.forEach((item, index) => {
      // position is 1-based (1 = next in line)
      const position = index + 1;
      const total = this.queue.length;
      try {
        item.onPositionUpdate(position, total);
      } catch (e) {
        // client might have disconnected
      }
    });
  }

  static async processNext() {
    if (this.activeRequest || this.queue.length === 0) {
      return;
    }

    const currentItem = this.queue.shift();
    this.activeRequest = currentItem;
    // Notify remaining queue items of their new moved-up positions
    this.broadcastPositions();

    try {
      // Position 0 means active / processing right now
      try {
        currentItem.onPositionUpdate(0, this.queue.length);
      } catch (e) {}

      const result = await currentItem.task();
      currentItem.resolve(result);
    } catch (err) {
      currentItem.reject(err);
    } finally {
      this.activeRequest = null;
      this.processNext();
    }
  }

  static remove(id) {
    const idx = this.queue.findIndex((item) => item.id === id);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      this.broadcastPositions();
    }
  }
}

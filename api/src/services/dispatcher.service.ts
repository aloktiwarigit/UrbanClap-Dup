export const dispatcherService = {
  triggerDispatch(bookingId: string): Promise<void> {
    console.log(`DISPATCH_TRIGGERED bookingId=${bookingId}`);
    return Promise.resolve();
  },
};

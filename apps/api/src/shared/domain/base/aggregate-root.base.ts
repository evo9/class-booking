export abstract class AggregateRoot {
  private readonly _events: object[] = [];

  protected raise(event: object): void {
    this._events.push(event);
  }

  pullEvents(): object[] {
    return this._events.splice(0);
  }
}

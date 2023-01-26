

export default class StateChangeEvent<T> extends Event{
  value :T;
  constructor(name :string, newValue :T){
    super(name);
    this.value = newValue;
  }
}
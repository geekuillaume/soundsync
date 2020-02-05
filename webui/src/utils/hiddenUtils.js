export const nameWithoutHiddenMeta = (str) => str.match(/^(\[hidden\] )?(.*)$/)[2];
export const isHidden = (str) => str.startsWith('[hidden] ');

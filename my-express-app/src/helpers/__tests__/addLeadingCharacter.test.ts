import addLeadingCharacter from '@/helpers/addLeadingCharacter';

describe('addLeadingCharacter', () => {
    test('Should return string with leading character', () => {
        expect(addLeadingCharacter('0', 3, '1')).toEqual('110');
    });
    test('Should return string with default leading character', () => {
        expect(addLeadingCharacter('0', 3)).toEqual('000');
    });
    test('Should return string with leading character even when given a number', () => {
        expect(addLeadingCharacter(1, 3, '1')).toEqual('111');
    });
    test('Should return string with default leading character even when given a number', () => {
        expect(addLeadingCharacter(1, 3)).toEqual('001');
    });
});

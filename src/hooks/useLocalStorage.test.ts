import { act, renderHook } from '@testing-library/react';
import useLocalStorage from './useLocalStorage';

describe('useLocalStorage', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    test('should store and retrieve a value', () => {
        const { result } = renderHook(() => useLocalStorage<string>('testKey', 'initialValue'));
        expect(result.current[0]).toBe('initialValue');

        act(() => {
            result.current[1]('newValue');
        });

        expect(result.current[0]).toBe('newValue');
        expect(window.localStorage.getItem('testKey')).toBe(JSON.stringify('newValue'));
    });

    test('should initialize with value from local storage', () => {
        window.localStorage.setItem('testKey', JSON.stringify('storedValue'));

        const { result } = renderHook(() => useLocalStorage<string>('testKey', 'initialValue'));

        expect(result.current[0]).toBe('storedValue');
    });
});

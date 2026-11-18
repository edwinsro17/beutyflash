import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RoleCard from '../../src/components/RoleCard';

describe('RoleCard Component', () => {
  test('renderiza título, descripción y dispara onPress', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <RoleCard
        selected
        onPress={onPressMock}
        roleLabel="CLIENTE"
        iconName="search"
        title="Encuentra lo que necesitas."
        description="Descubre profesionales fácilmente."
      />
    );
    expect(getByText('Encuentra lo que necesitas.')).toBeTruthy();
    fireEvent.press(getByText('Encuentra lo que necesitas.'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});

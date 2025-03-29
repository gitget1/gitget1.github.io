import React, { ForwardedRef, forwardRef, useRef } from 'react';
import { Dimensions, StyleSheet, View, TextInput, TextInputProps,Text, Pressable } from 'react-native';
import { colors } from '../constants';
import { mergeRefs } from '../utils/common';

interface InputFieldProps extends TextInputProps {
  disabled?: boolean; 
  error?: string;
  touched?: boolean;
}

const deviceHeight = Dimensions.get('screen').height;

const  InputField = forwardRef(({
   disabled = false,
   error,
     touched, 
     ...props
    }: InputFieldProps,
  ref?: ForwardedRef<TextInput>) => {
 const innerRef= useRef<TextInput | null>(null);
 
const handlePressInput = () => {
  innerRef.current?.focus();
};

  return (
   <Pressable onPress={() => innerRef.current?.focus()}>
     <View style={[styles.container, disabled && styles.disabled, touched && Boolean(error) && styles.inputerror,]}>  
      <TextInput
        ref={ref ? mergeRefs(innerRef, ref) : innerRef}
        editable={!disabled}
        placeholderTextColor={colors.GRAY_500}
        style={[styles.input, disabled && styles.disabled]} 
        autoCapitalize="none"
        spellCheck={false}
        autoCorrect={false}//키보드 켜지면 첫 글자 대문자랑 추천 단어 비활성화 (설정없으면 활성화로 기본설정되어있음) 
        {...props}
        />
        {touched && Boolean(error) && <Text style={styles.error}>{error}</Text>} 
     </View>
   </Pressable>

  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.GRAY_200,
    padding: deviceHeight > 700 ? 15 : 10,
  },
  input: {
    fontSize: 16,
    color: colors.BLACK,
    padding: 0,
  },
  disabled: {
    backgroundColor: colors.GRAY_200,
    color: colors.GRAY_700, 
  },
  inputerror:{
borderWidth: 1,
borderColor: colors.RED_300,  
  },
  error:{
   color: colors.RED_500,
    fontSize : 12,
    paddingTop : 5,
  },
});

export default InputField;

attribute vec4 _glesVertex;
attribute mediump vec4 _glesMultiTexCoord0;
uniform highp mat4 glstate_matrix_mvp;
uniform lowp float glstate_fog_start;
uniform lowp float glstate_fog_end;
uniform mediump vec4 _MainTex_ST;

varying lowp float factor;
varying mediump vec2 xlv_TEXCOORD0;
void main()
{
    highp vec4 tmpvar_1;
    tmpvar_1.w = 1.0;
    tmpvar_1.xyz = _glesVertex.xyz;
	// xlv_TEXCOORD0 = _glesMultiTexCoord0.xy;
    xlv_TEXCOORD0 = _glesMultiTexCoord0.xy * _MainTex_ST.xy + _MainTex_ST.zw; 
    highp vec4 pos = (glstate_matrix_mvp * tmpvar_1);
    factor = (glstate_fog_end - abs(pos.z))/(glstate_fog_end - glstate_fog_start); 
    factor = clamp(factor, 0.0, 1.0);  
    gl_Position = pos;
}
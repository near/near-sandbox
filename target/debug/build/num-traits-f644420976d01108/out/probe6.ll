; ModuleID = 'probe6.ed14347e0b178c8c-cgu.0'
source_filename = "probe6.ed14347e0b178c8c-cgu.0"
target datalayout = "e-m:o-i64:64-i128:128-n32:64-S128"
target triple = "arm64-apple-macosx11.0.0"

; core::num::<impl u32>::to_ne_bytes
; Function Attrs: inlinehint uwtable
define internal i32 @"_ZN4core3num21_$LT$impl$u20$u32$GT$11to_ne_bytes17hb1f0d636f63ca183E"(i32 %self) unnamed_addr #0 {
start:
  %0 = alloca [4 x i8], align 1
  store i32 %self, ptr %0, align 1
  %1 = load i32, ptr %0, align 1
  ret i32 %1
}

; probe6::probe
; Function Attrs: uwtable
define void @_ZN6probe65probe17hf6b8bdb0a13d24e6E() unnamed_addr #1 {
start:
  %0 = alloca i32, align 4
  %_1 = alloca [4 x i8], align 1
; call core::num::<impl u32>::to_ne_bytes
  %1 = call i32 @"_ZN4core3num21_$LT$impl$u20$u32$GT$11to_ne_bytes17hb1f0d636f63ca183E"(i32 1)
  store i32 %1, ptr %0, align 4
  call void @llvm.memcpy.p0.p0.i64(ptr align 1 %_1, ptr align 4 %0, i64 4, i1 false)
  ret void
}

; Function Attrs: nocallback nofree nounwind willreturn memory(argmem: readwrite)
declare void @llvm.memcpy.p0.p0.i64(ptr noalias nocapture writeonly, ptr noalias nocapture readonly, i64, i1 immarg) #2

attributes #0 = { inlinehint uwtable "frame-pointer"="non-leaf" "target-cpu"="apple-m1" }
attributes #1 = { uwtable "frame-pointer"="non-leaf" "target-cpu"="apple-m1" }
attributes #2 = { nocallback nofree nounwind willreturn memory(argmem: readwrite) }

!llvm.module.flags = !{!0}

!0 = !{i32 8, !"PIC Level", i32 2}

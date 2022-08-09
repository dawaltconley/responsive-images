set tabstop=2 softtabstop=0 expandtab shiftwidth=2 smarttab

let g:ale_fix_on_save = 1
let g:ale_fixers['typescript'] = ['prettier', 'eslint']
let g:ale_fixers['yaml'] = ['prettier']

source ~/.vim/coc.vim

call coc#config('tsserver.enable', v:true)
call coc#config('eslint.enable', v:true)

set tabstop=2 softtabstop=0 expandtab shiftwidth=2 smarttab

let g:ale_fix_on_save = 1
let g:ale_fixers['typescript'] = ['prettier', 'eslint']
let g:ale_fixers['yaml'] = ['prettier']

source ~/.vim/coc.vim

call coc#config('tsserver.enable', v:true)
" call coc#config('eslint.enable', v:true)

" Use K to show documentation in preview window.
nnoremap <silent> K :call <SID>show_documentation()<CR>

function! s:show_documentation()
  if CocAction('hasProvider', 'hover')
    call CocActionAsync('doHover')
  else
    call feedkeys('K', 'in')
  endif
endfunction

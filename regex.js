         ["[0-9]",                                                      "return 'NUMBER'"],
         ["[0-9][xX\\*][0-9]",                                          "return 'SET'"]
         ["(([0-9])|([0-1][0-9])|([2][0-3])):(([0-9])|([0-5][0-9]))",   "return 'TIME'"],
         ["([a-zA-Z]-[a-zA-Z]:|[a-zA-Z]:)",                             "return 'SETNAME'"] 
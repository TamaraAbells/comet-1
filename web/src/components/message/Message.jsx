import UserPopup from '@/components/user/UserPopup'
import UserAvatar from '@/components/user/UserAvatar'
import { calendarDate, shortTime } from '@/utils/timeUtils'
import { memo, useState } from 'react'
import { useContextMenuTrigger } from '@/components/ui/context'
import { ContextMenuType } from '@/types/ContextMenuType'
import Dialog from '@/components/ui/dialog/Dialog'

export default memo(function Message({ showUser, message }) {
  const [showImagePopup, setShowImagePopup] = useState(false)
  const contextMenuRef = useContextMenuTrigger({
    menuId: ContextMenuType.Message,
    data: { message }
  })
  return (
    <div className={`${showUser ? 'pt-4' : ''}`}>
      <div
        ref={contextMenuRef}
        className={`flex py-1 px-4 dark:hover:bg-gray-775 group`}
      >
        {showUser ? (
          <UserPopup user={message.author}>
            <UserAvatar
              user={message.author}
              size={10}
              className="dark:bg-gray-700 cursor-pointer"
            />
          </UserPopup>
        ) : (
          <div className="w-10 text-11 whitespace-nowrap text-mid group-hover:opacity-100 opacity-0 cursor-default leading-5 select-none">
            {shortTime(message.createdAt)}
          </div>
        )}

        <div className="pl-4">
          {showUser && (
            <div className="flex items-end pb-1.5">
              <UserPopup user={message.author}>
                <div className="text-sm font-medium cursor-pointer hover:underline leading-none">
                  {message.author.name}
                </div>
              </UserPopup>
              <div className="text-11 text-mid pl-2 leading-none cursor-default select-none">
                {calendarDate(message.createdAt)}
              </div>
            </div>
          )}

          {!!message.text && (
            <div
              className="text-base text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: message.text }}
            />
          )}

          {!!message.image && (
            <div className="pt-1">
              <img
                onClick={() => setShowImagePopup(true)}
                src={message.image.smallUrl}
                alt=""
                className="rounded cursor-pointer"
                width={message.image.smallWidth}
                height={message.image.smallHeight}
              />

              <Dialog
                closeOnOverlayClick
                close={() => setShowImagePopup(false)}
                isOpen={showImagePopup}
              >
                <div className="mx-auto">
                  <div className="text-left">
                    <img
                      onClick={e => e.stopPropagation()}
                      src={message.image.popupUrl}
                      alt=""
                      width={message.image.popupWidth}
                      height={message.image.popupHeight}
                    />
                    <div className="pt-1">
                      <a
                        href={message.image.originalUrl}
                        className="hover:underline cursor-pointer text-mid font-semibold text-13"
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={e => e.stopPropagation()}
                      >
                        Open original
                      </a>
                    </div>
                  </div>
                </div>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

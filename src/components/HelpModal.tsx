import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-primary text-text-dark p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-semibold">
                    OnlyWorlds Browse Tool
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md p-2 hover:bg-primary-dark transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6 text-sm leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
                  {/* Overview */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Overview</h3>
                    <p className="text-text-dark/80 text-xs">
                      The Browse Tool is a viewer and editor for <a href="https://onlyworlds.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">OnlyWorlds</a> and offers three core functions: viewing & editing world elements and their relations, writing extended texts for narratives and events, and publishing individual elements to public showcase URLs.
                    </p>
                    <div className="mt-3 space-y-1 text-text-dark/80 text-xs">
                      <p><strong>Left Sidebar:</strong> Select elements</p>
                      <p><strong>Center Panel:</strong> Element view with various modes</p>
                      <p><strong>Right Panel:</strong> Field editing and reverse relation view</p> 
                    </div>
                  </section>

                  {/* Element Editing */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Edit Mode</h3>
                    <p className="text-xs text-text-dark/80">
                      The default mode for viewing and editing elements. Click any field to modify it using the right panel. Save individual fields with the Save button, or press Ctrl+S to save all changes at once. Press Escape to discard unsaved changes.
                    </p>
                    <p className="text-xs text-text-dark/80 mt-2">
                      When no field is selected, the right panel shows reverse relations—all elements that reference the current one. For example, see which Characters list a Location as their birthplace.
                    </p>
                  </section>

                  {/* Showcase Mode */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Showcase Mode</h3>
                    <p className="text-xs text-text-dark/80">
                      Share read-only views of your elements with others using showcase URLs. No authentication required for viewers. Click the Share button on any element to generate a public URL. Showcase pages can be customized to exclude specific fields. One showcase exists per element, with newer versions overriding older ones.
                    </p>
                  </section>

                  {/* Graph Mode */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Network Graph</h3>
                    <p className="text-xs text-text-dark/80">
                      View relationships between elements in an interactive 2D or 3D graph. Control depth (1-5) to show more or fewer relationship layers. Drag nodes to reposition them, click to navigate to an element. Scroll to zoom, right or middle-click and drag to pan the view.
                    </p>
                  </section>

                  {/* Story Writing Mode */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Story Writing</h3>
                    <p className="text-xs text-text-dark/80">
                      Narrative and Event elements have dedicated writing interfaces with rich text editing and integration of element linking.
                      The editor automatically detects element names in your text, and offers easy way to 'link' these, through a widget or by typing //elementname, then space.
                      Linking means that the element is added to the multilink field of its corresponding type for the narrative or event.   
                    </p>
                  </section>

          

     
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-text-dark rounded text-sm transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}